import type { ReactNode } from 'react';
import { questionPieces, sentencePieces } from '@/lib/worksheets/questionSentence';
import {
  exerciseLabel,
  formatWorksheetDate,
  normalizeFieldOrder,
  type CrosswordEntry,
  type HeaderLineField,
  type WorksheetDocument,
  type WorksheetHeader,
  type WorksheetSection,
} from '@/lib/worksheets/types';

interface WorksheetTemplateProps {
  document: WorksheetDocument;
  /** When false, the answer key stays on screen but is left out of the print. */
  includeAnswerKey?: boolean;
}

function Field({
  label,
  children,
  size,
}: {
  label: string;
  children?: string;
  size: 'name' | 'date' | 'class';
}) {
  return (
    <div className={`worksheet-field worksheet-field--${size}`}>
      <span className="worksheet-field-label">{label}</span>
      <span className="worksheet-field-line">{children?.trim() || ''}</span>
    </div>
  );
}

function DigitBoxes({
  value,
  length,
  label,
  placeholder = '',
  large = false,
}: {
  value: string;
  length: number;
  label: string;
  placeholder?: string;
  large?: boolean;
}) {
  const digits = value.replace(/\D/g, '').slice(0, length).split('');
  const hints = [...placeholder].slice(0, length);
  return (
    <span className={large ? 'worksheet-id worksheet-id--roll' : 'worksheet-id'} aria-label={label}>
      {Array.from({ length }, (_, index) => {
        const digit = digits[index] || '';
        const hint = digit ? '' : hints[index] || '';
        return (
          <span
            key={index}
            className={large ? 'worksheet-id-box worksheet-id-box--roll' : 'worksheet-id-box'}
          >
            {digit ||
              (hint ? <span className="worksheet-id-placeholder">{hint}</span> : '')}
          </span>
        );
      })}
    </span>
  );
}

function safeImageUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return '';
}

function MatchContent({ text, imageUrl }: { text: string; imageUrl: string }) {
  const src = safeImageUrl(imageUrl);
  return (
    <div className="worksheet-match-item">
      {src ? <img src={src} alt={text ? '' : 'Matching picture'} className="worksheet-match-image" /> : null}
      {text ? <span>{text}</span> : null}
    </div>
  );
}

function ItemNumber({ index, children }: { index: number; children: ReactNode }) {
  return (
    <li className="worksheet-item">
      <span className="worksheet-number">{index + 1}.</span>
      <div className="worksheet-item-body">{children}</div>
    </li>
  );
}

function choiceLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function MarkedQuestion({ question, underline }: { question: string; underline: number[] }) {
  return (
    <p>
      {questionPieces(question, underline).map((piece, index) =>
        piece.underline ? (
          <span key={index} className="worksheet-underline">
            {piece.text}
          </span>
        ) : (
          <span key={index}>{piece.text}</span>
        )
      )}
    </p>
  );
}

function blankWidth(words: number): string {
  return `${Math.min(18, Math.max(6.5, words * 3))}rem`;
}

function BlankSentence({ sentence, blanks }: { sentence: string; blanks: [number, number][] }) {
  return (
    <p className="worksheet-response">
      {sentencePieces(sentence, blanks).map((piece, index) =>
        piece.type === 'blank' ? (
          <span
            key={index}
            className="worksheet-gap"
            style={{ minWidth: blankWidth(piece.words || 1) }}
          >
            <span className="sr-only">blank</span>
          </span>
        ) : (
          <span key={index}>{piece.text}</span>
        )
      )}
    </p>
  );
}

function sectionHeading(section: WorksheetSection): string {
  return section.title.trim() || exerciseLabel(section.type);
}

function printsOnPaper(section: WorksheetSection): boolean {
  return section.includeInPrint !== false;
}

function printableNumber(sections: WorksheetSection[], index: number): number {
  return sections.slice(0, index + 1).filter(printsOnPaper).length;
}

function ExerciseNumber({ index, printIndex }: { index: number; printIndex: number }) {
  return (
    <>
      <span className="worksheet-screen-number">{index + 1}. </span>
      <span className="worksheet-print-number">{printIndex}. </span>
    </>
  );
}

function SectionBlock({
  section,
  index,
  printIndex,
}: {
  section: WorksheetSection;
  index: number;
  printIndex: number;
}) {
  const prints = printsOnPaper(section);
  return (
    <section className={prints ? 'worksheet-section' : 'worksheet-section worksheet-no-print'}>
      {prints ? null : <p className="worksheet-screen-note">Not included when printing</p>}
      <h2>
        <ExerciseNumber index={index} printIndex={printIndex} />
        {sectionHeading(section)}
      </h2>
      {section.instructions ? <p className="worksheet-directions">{section.instructions}</p> : null}
      <SectionBody section={section} />
    </section>
  );
}

function SectionBody({ section }: { section: WorksheetSection }) {
  if (section.type === 'fill_blank') {
    return (
      <>
        {section.wordBank.length > 0 ? (
          <p className="worksheet-bank-line">
            <span>Word bank</span>
            {section.wordBank.join('   ·   ')}
          </p>
        ) : null}
        <ol className="worksheet-list">
          {section.items.map((item, index) => (
            <ItemNumber key={`${item.prompt}-${index}`} index={index}>
              {item.prompt}
            </ItemNumber>
          ))}
        </ol>
      </>
    );
  }

  if (section.type === 'multiple_choice') {
    return (
      <ol className="worksheet-list">
        {section.items.map((item, index) => (
          <ItemNumber key={`${item.prompt}-${index}`} index={index}>
            <p>{item.prompt}</p>
            <div className="worksheet-choices">
              {item.choices.map((choice, choiceIndex) => (
                <p key={`${choice}-${choiceIndex}`}>
                  <strong>{choiceLetter(choiceIndex)}.</strong> {choice}
                </p>
              ))}
            </div>
          </ItemNumber>
        ))}
      </ol>
    );
  }

  if (section.type === 'matching') {
    return (
      <div className="worksheet-match">
        {section.instructions.trim() ? null : (
          <p className="worksheet-directions">Write the letter in each box.</p>
        )}
        <ol className="worksheet-list worksheet-match-row">
          {section.prompts.map((prompt, index) => (
            <li key={`${prompt.text}-${index}`} className="worksheet-item worksheet-match-card">
              <div className="worksheet-match-head">
                <span className="worksheet-number">{index + 1}.</span>
                <span className="worksheet-match-box" aria-label={`Write the letter for ${index + 1}`} />
              </div>
              <MatchContent text={prompt.text} imageUrl={prompt.imageUrl} />
            </li>
          ))}
        </ol>
        <ol className="worksheet-list worksheet-match-defs">
          {section.bank.map((entry) => (
            <li key={entry.letter} className="worksheet-match-def">
              <span className="worksheet-number">{entry.letter}.</span>
              <MatchContent text={entry.text} imageUrl={entry.imageUrl} />
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (section.type === 'unjumble') {
    return (
      <ol className="worksheet-list">
        {section.items.map((item, index) => (
          <ItemNumber key={`${item.answer}-${index}`} index={index}>
            <p className="worksheet-chips">
              {item.words.map((word, wordIndex) => (
                <span key={`${word}-${wordIndex}`} className="worksheet-chip">
                  {word}
                </span>
              ))}
            </p>
            <span className="worksheet-write-line worksheet-write-line-jumble" />
          </ItemNumber>
        ))}
      </ol>
    );
  }

  if (section.type === 'anagram') {
    return (
      <ol className="worksheet-list">
        {section.items.map((item, index) => (
          <ItemNumber key={`${item.answer}-${index}`} index={index}>
            <p>{item.clue}</p>
            <p className="worksheet-chips">
              {[...item.scrambled].map((letter, letterIndex) => (
                <span key={`${letter}-${letterIndex}`} className="worksheet-chip worksheet-letter">
                  {letter}
                </span>
              ))}
            </p>
            <span className="worksheet-write-line" />
          </ItemNumber>
        ))}
      </ol>
    );
  }

  if (section.type === 'crossword') {
    return <CrosswordBlock entries={section.entries} />;
  }

  if (section.type === 'true_false') {
    return (
      <ol className="worksheet-list">
        {section.items.map((item, index) => (
          <ItemNumber key={`${item.statement}-${index}`} index={index}>
            <div className="worksheet-tf-row">
              <p>{item.statement}</p>
              <span className="worksheet-tf">
                <span>T</span>
                <span>F</span>
              </span>
            </div>
          </ItemNumber>
        ))}
      </ol>
    );
  }

  if (section.type === 'question_sentence') {
    return (
      <ol className="worksheet-list">
        {section.items.map((item, index) => (
          <ItemNumber key={`${item.question}-${index}`} index={index}>
            <MarkedQuestion question={item.question} underline={item.underline} />
            {item.sentence.trim() ? (
              <BlankSentence sentence={item.sentence} blanks={item.blanks} />
            ) : null}
          </ItemNumber>
        ))}
      </ol>
    );
  }

  return (
    <ol className="worksheet-list">
      {section.items.map((item, index) => (
        <ItemNumber key={`${item.prompt}-${index}`} index={index}>
          <p>{item.prompt}</p>
          <span className="worksheet-write-line" />
          <span className="worksheet-write-line" />
        </ItemNumber>
      ))}
    </ol>
  );
}

function answerLines(section: WorksheetSection): string[] {
  if (section.type === 'fill_blank') {
    return section.items.map((item) => item.answer);
  }
  if (section.type === 'multiple_choice') {
    return section.items.map((item) => {
      const index = item.choices.findIndex(
        (choice) => choice.toLowerCase() === item.answer.toLowerCase()
      );
      const letter = index >= 0 ? choiceLetter(index) : '?';
      return `${letter}. ${item.answer}`;
    });
  }
  if (section.type === 'matching') {
    return section.answers.map((letter, index) => `${index + 1} — ${letter}`);
  }
  if (section.type === 'unjumble') {
    return section.items.map((item) => item.answer);
  }
  if (section.type === 'anagram') {
    return section.items.map((item) => item.answer);
  }
  if (section.type === 'true_false') {
    return section.items.map((item) => (item.answer ? 'True' : 'False'));
  }
  if (section.type === 'question_sentence') {
    return section.items.map((item) => item.sentence.trim());
  }
  if (section.type === 'crossword') {
    return [...section.entries]
      .sort((a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1))
      .map(
        (entry) =>
          `${entry.number} ${entry.direction === 'across' ? 'Across' : 'Down'} — ${entry.answer}`
      );
  }
  return section.items.map((item) => item.answer);
}

function crosswordBounds(entries: CrosswordEntry[]): { rows: number; cols: number } {
  let rows = 0;
  let cols = 0;
  for (const entry of entries) {
    rows = Math.max(rows, entry.row + (entry.direction === 'down' ? entry.answer.length : 1));
    cols = Math.max(cols, entry.col + (entry.direction === 'across' ? entry.answer.length : 1));
  }
  return { rows, cols };
}

function CrosswordGrid({
  entries,
  showAnswers = false,
}: {
  entries: CrosswordEntry[];
  showAnswers?: boolean;
}) {
  const { rows, cols } = crosswordBounds(entries);
  if (rows === 0 || cols === 0) return null;

  const letters = new Map<string, string>();
  const numbers = new Map<string, number>();
  for (const entry of entries) {
    const start = `${entry.row},${entry.col}`;
    const current = numbers.get(start);
    if (current === undefined || entry.number < current) numbers.set(start, entry.number);
    for (let index = 0; index < entry.answer.length; index += 1) {
      const row = entry.direction === 'down' ? entry.row + index : entry.row;
      const col = entry.direction === 'across' ? entry.col + index : entry.col;
      letters.set(`${row},${col}`, entry.answer[index] || '');
    }
  }

  return (
    <div className="worksheet-crossword-wrap">
      <div
        className={`worksheet-crossword${showAnswers ? ' worksheet-crossword-solved' : ''}`}
        aria-hidden={showAnswers ? undefined : true}
        aria-label={showAnswers ? 'Completed crossword' : undefined}
        style={{ gridTemplateColumns: `repeat(${cols}, var(--crossword-cell))` }}
      >
        {Array.from({ length: rows * cols }, (_, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const key = `${row},${col}`;
          const letter = letters.get(key);
          if (!letter) {
            return <span key={key} className="worksheet-crossword-block" aria-hidden />;
          }
          const number = numbers.get(key);
          return (
            <span key={key} className="worksheet-crossword-cell">
              {number ? <span className="worksheet-crossword-num">{number}</span> : null}
              {showAnswers ? letter : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function CrosswordClues({ entries }: { entries: CrosswordEntry[] }) {
  const groups = [
    { label: 'Across', items: entries.filter((entry) => entry.direction === 'across') },
    { label: 'Down', items: entries.filter((entry) => entry.direction === 'down') },
  ].map((group) => ({
    ...group,
    items: [...group.items].sort((a, b) => a.number - b.number),
  }));

  return (
    <div className="worksheet-crossword-clues">
      {groups.map((group) => (
        <div key={group.label}>
          <h3>{group.label}</h3>
          {group.items.length === 0 ? (
            <p className="worksheet-crossword-empty">None</p>
          ) : (
            <ul>
              {group.items.map((entry) => (
                <li key={`${entry.direction}-${entry.number}`}>
                  <span>{entry.number}.</span>
                  {entry.clue}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function CrosswordBlock({
  entries,
  showAnswers = false,
}: {
  entries: CrosswordEntry[];
  showAnswers?: boolean;
}) {
  return (
    <>
      <CrosswordGrid entries={entries} showAnswers={showAnswers} />
      {showAnswers ? null : <CrosswordClues entries={entries} />}
    </>
  );
}

function AnswerKey({ sections }: { sections: WorksheetSection[] }) {
  return (
    <article className="worksheet-sheet worksheet-answer-key">
      <p className="worksheet-kicker">Teacher copy</p>
      <h1 className="worksheet-title">Answer key</h1>
      {sections.map((section, sectionIndex) => (
        <section
          key={`${section.type}-${sectionIndex}`}
          className={
            printsOnPaper(section) ? 'worksheet-section' : 'worksheet-section worksheet-no-print'
          }
        >
          <h2>
            <ExerciseNumber
              index={sectionIndex}
              printIndex={printableNumber(sections, sectionIndex)}
            />
            {sectionHeading(section)}
          </h2>
          {section.type === 'crossword' ? (
            <CrosswordBlock entries={section.entries} showAnswers />
          ) : null}
          <ol className="worksheet-list worksheet-key-list">
            {answerLines(section).map((line, index) => (
              <li key={`${line}-${index}`}>
                {section.type === 'matching' || section.type === 'crossword'
                  ? line
                  : `${index + 1}. ${line}`}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </article>
  );
}

const SHEET_CSS = `
@page {
  size: A4;
  margin: 15mm 14mm;
}
.worksheet-template {
  --crossword-cell: 2.55rem;
}
.worksheet-sheet {
  width: 100%;
  margin: 0 auto;
  background: white;
  color: var(--brand-navy);
  border: 4px solid var(--brand-navy);
  box-shadow: 8px 8px 0 var(--brand-navy);
  padding: 0.85rem 0.75rem 1.1rem;
  font-family: var(--font-fredoka), ui-sans-serif, system-ui, sans-serif;
  font-size: 1.05rem;
}
.worksheet-kicker {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-red);
}
.worksheet-title {
  margin: 0.15rem 0 0.85rem;
  font-size: 1.7rem;
  line-height: 1.15;
  font-weight: 700;
  color: var(--brand-navy);
}
.worksheet-rule {
  height: 4px;
  width: 4.5rem;
  margin: -0.45rem 0 0.9rem;
  background: var(--brand-red);
}
.worksheet-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  column-gap: 1.15rem;
  row-gap: 0.55rem;
  margin-bottom: 1rem;
}
.worksheet-field {
  display: flex;
  align-items: flex-end;
  gap: 0.35rem;
  min-width: 0;
  max-width: 100%;
  font-size: 0.95rem;
}
.worksheet-field-label {
  font-weight: 700;
  white-space: nowrap;
}
.worksheet-field-line {
  display: block;
  min-height: 1.15rem;
  border-bottom: 1.5px solid var(--brand-navy);
  font-weight: 600;
  overflow-wrap: anywhere;
}
.worksheet-field--name {
  flex: 1 1 11rem;
}
.worksheet-field--name .worksheet-field-line {
  flex: 1 1 auto;
  min-width: 7rem;
}
.worksheet-field--date {
  flex: 0 0 auto;
}
.worksheet-field--date .worksheet-field-line {
  width: max-content;
  min-width: 6.4rem;
}
.worksheet-field--class {
  flex: 0 0 auto;
}
.worksheet-field--class .worksheet-field-line {
  width: max-content;
  min-width: 3.6rem;
}
.worksheet-field--boxes {
  flex: 0 0 auto;
}
.worksheet-id {
  display: inline-flex;
  gap: 0.2rem;
}
.worksheet-id-box {
  width: 1.35rem;
  height: 1.45rem;
  border: 2px solid var(--brand-navy);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
}
.worksheet-id--roll {
  gap: 0.3rem;
}
.worksheet-id-box--roll {
  width: 1.95rem;
  height: 2.1rem;
  font-size: 1.2rem;
}
.worksheet-id-placeholder {
  font-weight: 400;
  color: #d3d8e0;
}
.worksheet-note {
  margin: 0 0 0.9rem;
  font-weight: 600;
}
.worksheet-empty {
  margin: 0.5rem 0 0;
  font-weight: 600;
  color: var(--brand-medium-gray);
}
.worksheet-section {
  margin-top: 1.35rem;
}
.worksheet-print-number {
  display: none;
}
.worksheet-screen-note {
  margin: 0 0 0.2rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b93a1;
}
.worksheet-section h2 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--brand-red);
}
.worksheet-directions {
  margin: 0 0 0.4rem;
  font-weight: 600;
  font-size: 0.92rem;
}
.worksheet-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.worksheet-item {
  display: flex;
  gap: 0.45rem;
  align-items: flex-start;
  margin: 0.75rem 0;
}
.worksheet-number {
  font-weight: 700;
  min-width: 1.4rem;
}
.worksheet-item-body {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  line-height: 1.5;
}
.worksheet-item-body p {
  margin: 0;
}
.worksheet-choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.15rem 0.8rem;
  margin-top: 0.2rem;
}
.worksheet-bank-line {
  margin: 0 0 0.45rem;
  padding: 0.35rem 0.55rem;
  border: 2px dashed var(--brand-navy);
  font-weight: 700;
}
.worksheet-bank-line span {
  display: block;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--brand-red);
}
.worksheet-match {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.worksheet-match-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.65rem 0.85rem;
}
.worksheet-match-row .worksheet-item {
  flex: 1 1 7rem;
  max-width: 8.4rem;
  margin: 0;
}
.worksheet-match-card {
  flex-direction: column;
  align-items: stretch;
  gap: 0.3rem;
}
.worksheet-match-head {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.worksheet-match-box {
  width: 1.55rem;
  height: 1.55rem;
  border: 2px solid var(--brand-navy);
  flex: 0 0 auto;
}
.worksheet-match-defs {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.45rem 1.15rem;
}
.worksheet-match-def {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  max-width: 100%;
}
.worksheet-match-def .worksheet-number {
  min-width: 0;
}
.worksheet-match-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}
.worksheet-match-image {
  display: block;
  width: auto;
  max-width: 100%;
  height: 5.4rem;
  object-fit: contain;
  object-position: left center;
}
.worksheet-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.35rem;
}
.worksheet-chip {
  border: 2px solid var(--brand-navy);
  padding: 0.05rem 0.4rem;
  font-weight: 700;
  background: var(--brand-gray);
}
.worksheet-letter {
  min-width: 1.35rem;
  text-align: center;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}
.worksheet-write-line {
  display: block;
  border-bottom: 1.5px solid var(--brand-navy);
  height: 1.75rem;
  margin-top: 0.2rem;
}
.worksheet-response {
  margin-top: 0.55rem !important;
}
.worksheet-underline {
  text-decoration: underline;
  text-underline-offset: 0.14em;
  text-decoration-thickness: 1.25px;
}
.worksheet-gap {
  display: inline-block;
  min-width: 7rem;
  height: 1em;
  margin: 0 0.2rem;
  border-bottom: 1.5px solid currentColor;
  vertical-align: text-bottom;
}
.worksheet-write-line-jumble {
  height: 2.2rem;
  margin-top: 0.4rem;
}
.worksheet-tf-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}
.worksheet-tf {
  display: inline-flex;
  gap: 0.3rem;
  flex-shrink: 0;
}
.worksheet-tf span {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--brand-navy);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}
.worksheet-crossword-wrap {
  overflow-x: auto;
  max-width: 100%;
  margin: 0.35rem 0 0.7rem;
}
.worksheet-crossword {
  display: grid;
  width: max-content;
  border: 2px solid var(--brand-navy);
}
.worksheet-crossword-cell,
.worksheet-crossword-block {
  width: var(--crossword-cell);
  height: var(--crossword-cell);
  box-sizing: border-box;
}
.worksheet-crossword-solved {
  --crossword-cell: 1.45rem;
}
.worksheet-crossword-cell {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.06rem;
  border: 1px solid var(--brand-navy);
  background: white;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1;
}
.worksheet-crossword-block {
  background: #d4d4d1;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.worksheet-crossword-num {
  position: absolute;
  top: 0;
  left: 1px;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1;
}
.worksheet-crossword-clues {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem 1.25rem;
}
.worksheet-crossword-clues h3 {
  margin: 0 0 0.15rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--brand-red);
}
.worksheet-crossword-clues ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.worksheet-crossword-clues li {
  display: flex;
  gap: 0.35rem;
  margin: 0.2rem 0;
  font-weight: 500;
}
.worksheet-crossword-clues li span {
  font-weight: 700;
  min-width: 1.2rem;
}
.worksheet-crossword-empty {
  margin: 0;
  font-weight: 600;
}
.worksheet-answer-key {
  margin-top: 1.5rem;
}
.worksheet-key-list li {
  margin: 0.2rem 0;
  font-weight: 600;
}
@media (max-width: 640px) {
  .worksheet-choices,
  .worksheet-crossword-clues {
    grid-template-columns: 1fr;
  }
}
@media print {
  .worksheet-screen-number,
  .worksheet-screen-note,
  .worksheet-no-print {
    display: none !important;
  }
  .worksheet-print-number {
    display: inline !important;
  }
  body:has(.worksheet-print-root),
  .worksheet-print-root {
    background: white !important;
  }
  .worksheet-builder {
    max-width: none !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .worksheet-template {
    --crossword-cell: 11.5mm;
  }
  .worksheet-crossword-solved {
    --crossword-cell: 6.5mm;
  }
  .worksheet-sheet {
    box-shadow: none !important;
    border: none !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 12pt;
  }
  .worksheet-match-image {
    width: auto;
    max-width: 100%;
    height: 28mm;
    max-height: 28mm;
  }
  .worksheet-answer-key {
    break-before: page;
    page-break-before: always;
    margin-top: 0;
  }
  .worksheet-chip {
    background: transparent !important;
  }
}
`;

function headerLine(header: WorksheetHeader, key: HeaderLineField) {
  if (!header.show[key]) return null;
  if (key === 'teacherName') {
    return (
      <Field key={key} label="Teacher" size="name">
        {header.teacherName}
      </Field>
    );
  }
  if (key === 'studentName') {
    return (
      <Field key={key} label="Student" size="name">
        {header.studentName}
      </Field>
    );
  }
  if (key === 'className') {
    return (
      <Field key={key} label="Class" size="class">
        {header.className}
      </Field>
    );
  }
  if (key === 'date') {
    return (
      <Field key={key} label="Date" size="date">
        {formatWorksheetDate(header.date)}
      </Field>
    );
  }
  if (key === 'dueDate') {
    return (
      <Field key={key} label="Due" size="date">
        {formatWorksheetDate(header.dueDate)}
      </Field>
    );
  }
  if (key === 'studentId') {
    return (
      <div key={key} className="worksheet-field worksheet-field--boxes">
        <span className="worksheet-field-label">ID no.</span>
        <DigitBoxes value={header.studentId} length={5} label="Student ID, 5 digits" />
      </div>
    );
  }
  return (
    <div key={key} className="worksheet-field worksheet-field--boxes">
      <span className="worksheet-field-label">Roll no.</span>
      <DigitBoxes
        value={header.rollNumber}
        length={2}
        label="Roll number, 2 digits"
        placeholder={header.rollPlaceholder || ''}
        large
      />
    </div>
  );
}

/** The shared paper layout. Any WorksheetDocument can be printed with this. */
export default function WorksheetTemplate({
  document,
  includeAnswerKey = false,
}: WorksheetTemplateProps) {
  const { header, sections } = document;
  const show = header.show;
  const meta = normalizeFieldOrder(header.fieldOrder)
    .map((key) => headerLine(header, key))
    .filter(Boolean);

  return (
    <div className="worksheet-template">
      <style>{SHEET_CSS}</style>
      <article className="worksheet-sheet">
        {show.masthead && header.masthead.trim() ? (
          <p className="worksheet-kicker">{header.masthead.trim()}</p>
        ) : null}
        {show.title ? (
          <h1 className="worksheet-title">{header.title.trim() || 'Worksheet'}</h1>
        ) : null}
        {show.title ? <div className="worksheet-rule" /> : null}
        {meta.length > 0 ? <div className="worksheet-meta">{meta}</div> : null}
        {show.instructions && header.instructions.trim() ? (
          <p className="worksheet-note">{header.instructions}</p>
        ) : null}
        {sections.length === 0 ? (
          <p className="worksheet-empty print:hidden">
            Your exercises will land here. The header above is the template for every worksheet.
          </p>
        ) : (
          sections.map((section, index) => (
            <SectionBlock
              key={`${section.type}-${index}`}
              section={section}
              index={index}
              printIndex={printableNumber(sections, index)}
            />
          ))
        )}
      </article>
      {sections.length > 0 ? (
        <div className={includeAnswerKey ? undefined : 'print:hidden'}>
          <AnswerKey sections={sections} />
        </div>
      ) : null}
    </div>
  );
}
