import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Hardcoded Simulation Data
const DEFAULT_PIN = "1234";
const INITIAL_BALANCE = 10000;
const MAX_ATTEMPTS = 3;

enum DFAState {
  Q0 = 'q0', // Start State
  Q1 = 'q1', // Card Inserted
  Q2 = 'q2', // PIN Verification
  Q3 = 'q3', // User Authenticated
  Q4 = 'q4', // Transaction Selected
  Q5 = 'q5', // Transaction Processing
  Q6 = 'q6', // Transaction Successful (Accept State)
  Q7 = 'q7', // Transaction Failed
  Q8 = 'q8', // Account Blocked
}

enum DFAInput {
  INSERT_CARD = 'c',
  ENTER_PIN = 'p',
  VALID_PIN = 'v',
  INVALID_PIN = 'i',
  SELECT_TX = 't',
  WITHDRAW = 'w',
  SUFFICIENT = 's',
  INSUFFICIENT = 'n',
  EXIT = 'x',
}

interface Session {
  currentState: DFAState;
  balance: number;
  pinAttempts: number;
  history: Array<any>;
  lastMessage: string;
}

// In-memory session (per-server run, single user simulation)
let session: Session = {
  currentState: DFAState.Q0,
  balance: INITIAL_BALANCE,
  pinAttempts: 0,
  history: [],
  lastMessage: ""
};

function logTransition(input: string, msg: string) {
  const from = session.history.length > 0 ? session.history[session.history.length - 1].to : DFAState.Q0;
  session.lastMessage = msg;
  session.history.push({
    from,
    to: session.currentState,
    input,
    msg,
    timestamp: Date.now()
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/session', (req, res) => {
    res.json(session);
  });

  app.post('/api/reset', (req, res) => {
    session = {
      currentState: DFAState.Q0,
      balance: INITIAL_BALANCE,
      pinAttempts: 0,
      history: [],
      lastMessage: ""
    };
    res.json(session);
  });

  app.post('/api/transition', (req, res) => {
    const { input, data } = req.body;
    let valid = true;
    let msg = "";

    switch (session.currentState) {
      case DFAState.Q0:
        if (input === DFAInput.INSERT_CARD) {
          session.currentState = DFAState.Q1;
          msg = "Card inserted successfully.";
        } else valid = false;
        break;

      case DFAState.Q1:
        if (input === DFAInput.ENTER_PIN) {
          session.currentState = DFAState.Q2;
          msg = "Please enter your 4-digit PIN.";
        } else valid = false;
        break;

      case DFAState.Q2:
        if (input === DFAInput.ENTER_PIN) {
          if (data?.pin?.length === 4) {
            // Full PIN entered, do validation
            if (data?.pin === DEFAULT_PIN) {
                session.currentState = DFAState.Q4; 
                session.pinAttempts = 0;
                msg = "PIN Verified. Access Granted.";
            } else {
                session.pinAttempts++;
                if (session.pinAttempts >= MAX_ATTEMPTS) {
                    session.currentState = DFAState.Q8;
                    msg = "Too many failed attempts. Card Blocked.";
                } else {
                    session.currentState = DFAState.Q2; 
                    msg = `Invalid PIN. Attempt ${session.pinAttempts}/${MAX_ATTEMPTS}`;
                }
            }
          } else {
             // Stay in Q2 if entering digits but not yet 4
             session.currentState = DFAState.Q2;
             msg = "Entering PIN...";
          }
        } else valid = false;
        break;

      case DFAState.Q3: // Still support Q3 for DFA completeness if needed
        if (input === DFAInput.SELECT_TX) {
          session.currentState = DFAState.Q4;
          msg = "Transaction menu selected.";
        } else if (input === DFAInput.EXIT) {
          session.currentState = DFAState.Q0;
          msg = "Logged out.";
        } else valid = false;
        break;

      case DFAState.Q4:
        if (input === DFAInput.WITHDRAW) {
          session.currentState = DFAState.Q5;
          msg = "Please enter withdrawal amount.";
        } else if (input === DFAInput.EXIT) {
          session.currentState = DFAState.Q0;
        } else valid = false;
        break;

      case DFAState.Q5:
        if (input === DFAInput.WITHDRAW) {
          const amount = data?.amount || 0;
          if (amount <= 0) {
            valid = false;
            msg = "Invalid amount.";
          } else if (amount <= session.balance) {
            session.balance -= amount;
            session.currentState = DFAState.Q6;
            msg = `Withdrawal successful: ₹${amount}`;
          } else {
            session.currentState = DFAState.Q7;
            msg = `Insufficient balance. Available: ₹${session.balance}`;
          }
        } else if (input === DFAInput.EXIT) {
          session.currentState = DFAState.Q0;
        } else valid = false;
        break;

      case DFAState.Q6:
        if (input === DFAInput.EXIT) {
          session.currentState = DFAState.Q0;
          msg = "Session Ended.";
        } else valid = false;
        break;

      case DFAState.Q7:
        if (input === DFAInput.SELECT_TX) {
          session.currentState = DFAState.Q4;
          msg = "Retrying transaction.";
        } else if (input === DFAInput.EXIT) {
          session.currentState = DFAState.Q0;
          msg = "Session Ended.";
        } else valid = false;
        break;

      case DFAState.Q8:
        if (input === DFAInput.EXIT) {
           session.currentState = DFAState.Q0;
           session.pinAttempts = 0; // Reset for demo purposes
           msg = "Redirected to main menu.";
        } else valid = false;
        break;
    }

    if (!valid) {
      return res.status(400).json({ error: "Invalid transition for current state", state: session.currentState });
    }

    logTransition(input, msg);
    res.json(session);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
