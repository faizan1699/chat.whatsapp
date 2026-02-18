'use client';

import { Suspense } from 'react';
import ChatPageContent from './ChatPageContent';

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
