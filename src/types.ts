/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum DFAState {
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

export enum DFAInput {
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

export interface BankSession {
  currentState: DFAState;
  balance: number;
  pinAttempts: number;
  lastMessage: string;
  history: Array<{ state: DFAState; input: DFAInput | string; msg: string; timestamp: number }>;
}
