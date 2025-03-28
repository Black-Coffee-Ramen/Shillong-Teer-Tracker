import { Transition as HeadlessTransition } from '@headlessui/react';
import { ReactNode } from 'react';

interface TransitionProps {
  show: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  children: ReactNode;
}

export function Transition({
  show,
  enter = '',
  enterFrom = '',
  enterTo = '',
  leave = '',
  leaveFrom = '',
  leaveTo = '',
  children,
}: TransitionProps) {
  return (
    <HeadlessTransition
      show={show}
      enter={enter}
      enterFrom={enterFrom}
      enterTo={enterTo}
      leave={leave}
      leaveFrom={leaveFrom}
      leaveTo={leaveTo}
    >
      {children}
    </HeadlessTransition>
  );
}