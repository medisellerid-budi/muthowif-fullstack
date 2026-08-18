import { useEffect, useState, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';

export interface HandEntry {
  name: string;
  timestamp: number;
  called?: boolean;
}

type RaiseHandMessage =
  | { type: 'RAISE_HAND'; name: string; timestamp: number }
  | { type: 'LOWER_HAND'; name: string }
  | { type: 'CALL_PARTICIPANT'; name: string }
  | { type: 'CLEAR_HAND'; name: string }
  | { type: 'OPEN_QUESTIONS' }
  | { type: 'CLOSE_QUESTIONS' };

export function useRaiseHand(myName: string, isGuide: boolean) {
  const room = useRoomContext();
  const [queue, setQueue] = useState<HandEntry[]>([]);
  const [iAmCalled, setIAmCalled] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);

  const publish = useCallback(
    (msg: RaiseHandMessage) => {
      if (!room) return;
      const data = new TextEncoder().encode(JSON.stringify(msg));
      room.localParticipant.publishData(data, { reliable: true });
    },
    [room]
  );

  useEffect(() => {
    if (!room) return;
    const handler = (payload: Uint8Array) => {
      try {
        const msg: RaiseHandMessage = JSON.parse(new TextDecoder().decode(payload));
        switch (msg.type) {
          case 'OPEN_QUESTIONS':
            setQuestionsOpen(true);
            break;
          case 'CLOSE_QUESTIONS':
            setQuestionsOpen(false);
            setQueue([]);
            setIAmCalled(false);
            break;
          case 'RAISE_HAND':
            setQueue(prev => {
              if (prev.find(e => e.name === msg.name)) return prev;
              return [...prev, { name: msg.name, timestamp: msg.timestamp }]
                .sort((a, b) => a.timestamp - b.timestamp);
            });
            break;
          case 'LOWER_HAND':
            setQueue(prev => prev.filter(e => e.name !== msg.name));
            if (msg.name === myName) setIAmCalled(false);
            break;
          case 'CALL_PARTICIPANT':
            setQueue(prev =>
              prev.map(e => e.name === msg.name ? { ...e, called: true } : { ...e, called: false })
            );
            if (msg.name === myName) setIAmCalled(true);
            break;
          case 'CLEAR_HAND':
            setQueue(prev => prev.filter(e => e.name !== msg.name));
            if (msg.name === myName) setIAmCalled(false);
            break;
        }
      } catch {}
    };
    room.on('dataReceived', handler);
    return () => { room.off('dataReceived', handler); };
  }, [room, myName]);

  const raiseHand = useCallback(() => {
    const ts = Date.now();
    publish({ type: 'RAISE_HAND', name: myName, timestamp: ts });
    setQueue(prev => {
      if (prev.find(e => e.name === myName)) return prev;
      return [...prev, { name: myName, timestamp: ts }].sort((a, b) => a.timestamp - b.timestamp);
    });
  }, [publish, myName]);

  const lowerHand = useCallback(() => {
    publish({ type: 'LOWER_HAND', name: myName });
    setQueue(prev => prev.filter(e => e.name !== myName));
    setIAmCalled(false);
  }, [publish, myName]);

  const callParticipant = useCallback((name: string) => {
    if (!isGuide) return;
    publish({ type: 'CALL_PARTICIPANT', name });
    setQueue(prev => prev.map(e => e.name === name ? { ...e, called: true } : { ...e, called: false }));
  }, [publish, isGuide]);

  const clearFromQueue = useCallback((name: string) => {
    if (!isGuide) return;
    publish({ type: 'CLEAR_HAND', name });
    setQueue(prev => prev.filter(e => e.name !== name));
  }, [publish, isGuide]);

  const openQuestions = useCallback(() => {
    if (!isGuide) return;
    publish({ type: 'OPEN_QUESTIONS' });
    setQuestionsOpen(true);
  }, [publish, isGuide]);

  const closeQuestions = useCallback(() => {
    if (!isGuide) return;
    publish({ type: 'CLOSE_QUESTIONS' });
    setQuestionsOpen(false);
    setQueue([]);
  }, [publish, isGuide]);

  const myPosition = queue.findIndex(e => e.name === myName) + 1;
  const isHandRaised = queue.some(e => e.name === myName);

  return {
    queue, isHandRaised, myPosition, iAmCalled, questionsOpen,
    raiseHand, lowerHand, callParticipant, clearFromQueue,
    openQuestions, closeQuestions,
  };
}
