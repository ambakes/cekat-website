import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { createPracticeSet, getPracticeScore } from './model';

const newRound = () => ({ scenarios: createPracticeSet(), index: 0, answers: {} as Record<string, string> });

export function Practice() {
  const [round, setRound] = useState(newRound);
  const label = useRef<HTMLSpanElement>(null);
  const focusNext = useRef(false);
  const scenario = round.scenarios[round.index];
  const selectedId = round.answers[scenario.id];
  const selected = scenario.choices.find((choice) => choice.id === selectedId);
  const safest = scenario.choices.find((choice) => choice.correct)!;
  const score = getPracticeScore(round.scenarios, round.answers);
  const finished = round.index === round.scenarios.length - 1;

  useEffect(() => {
    if (focusNext.current) { label.current?.focus({ preventScroll: true }); focusNext.current = false; }
  }, [round.index, round.scenarios]);
  const answer = (id: string) => setRound((previous) => {
    const current = previous.scenarios[previous.index];
    if (previous.answers[current.id] || !current.choices.some((choice) => choice.id === id)) return previous;
    return { ...previous, answers: { ...previous.answers, [current.id]: id } };
  });
  const next = () => {
    if (!selected) return;
    focusNext.current = true;
    setRound((previous) => finished ? newRound() : { ...previous, index: previous.index + 1 });
  };

  return (
    <section className="section practice-section" id="latihan" aria-labelledby="latihan-title">
      <div className="wrap practice-grid">
        <div className="practice-copy"><h2 id="latihan-title">Kalau kamu di situasi ini?</h2><p>{round.scenarios.length} situasi sehari-hari tingkat menengah. Pilih jawaban A–C yang paling aman, lalu baca alasannya.</p><p className="practice-score" aria-live="polite">{score.answered === 0 ? 'Belum dijawab' : score.complete ? `Skor akhir: ${score.correct} dari ${score.total} benar` : `${score.correct} dari ${score.answered} benar`}</p></div>
        <div className="scenario-card">
          <div className="scenario-top"><span ref={label} tabIndex={-1}>Simulasi {String(round.index + 1).padStart(2, '0')} / {String(round.scenarios.length).padStart(2, '0')}</span></div>
          <div className="scenario-context"><span className="scenario-avatar" aria-hidden="true">{scenario.avatar}</span><div><p className="scenario-name">{scenario.name}</p><p className="scenario-note">{scenario.note}</p></div></div>
          <div className="chat-body">{scenario.messages.map((message) => <div className="bubble-mini" key={message}>{message}</div>)}</div>
          <p className="scenario-question">{scenario.question}</p>
          <div className="choices">{scenario.choices.map((choice, index) => <button key={choice.id} className={`choice${selected && choice.correct ? ' correct' : ''}${selectedId === choice.id && !choice.correct ? ' incorrect' : ''}`} type="button" disabled={Boolean(selected)} onClick={() => answer(choice.id)}><span className="choice-key">{String.fromCharCode(65 + index)}</span><span>{choice.text}</span></button>)}</div>
          <p className={`feedback${selected && !selected.correct ? ' bad' : ''}`} aria-live="polite">{selected ? selected.correct ? `Tepat. ${selected.feedback}` : `${selected.feedback}\n\nPilihan paling aman: ${safest.text} ${safest.feedback}` : ''}</p>
          <div className="scenario-actions"><span className="tool-hint">{selected ? 'Jawaban dikunci. Baca alasannya.' : 'Pilih satu jawaban paling aman.'}</span>{selected && <button className="btn btn-outline btn-small" type="button" onClick={next}>{finished ? 'Ulangi latihan' : 'Situasi berikutnya'}<Icon name="arrow" /></button>}</div>
        </div>
      </div>
    </section>
  );
}
