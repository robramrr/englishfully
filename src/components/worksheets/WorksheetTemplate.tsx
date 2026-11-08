import type { ReactNode } from 'react';
import {
  formatWorksheetDate,
  type WorksheetDocument,
  type WorksheetSection,
} from '@/lib/worksheets/types';

interface WorksheetTemplateProps {
  document: WorksheetDocument;
  /** When false, the answer key stays on screen but is left out of the print. */
  includeAnswerKey?: boolean;
}

function Field({ label, children }: { label: string; children?: string }) {
  return (
    <div className="worksheet-field">
      <span className="worksheet-field-label">{label}</span>
      {children?.trim() ? (
        <span className="worksheet-field-value">{children}</span>
      ) : (
        <span className="worksheet-blank" />
      )}
    </div>
  );
}

function IdBoxes({ value }: { value: string }) {
  const digits = value.replace(/\D/g, '').slice(0, 5).split('');
  return (
    <span className="worksheet-id" aria-label="Student ID, 5 digits">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="worksheet-id-box">
          {digits[index] || ''}
        </span>
      ))}
    </span>
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

function SectionBlock({ section, index }: { section: WorksheetSection; index: number }) {
  return (
    <section className="worksheet-section">
      <h2>
        {index + 1}. {section.title}
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
        <ol className="worksheet-list">
          {section.prompts.map((prompt, index) => (
            <ItemNumber key={`${prompt}-${index}`} index={index}>
              {prompt}
            </ItemNumber>
          ))}
        </ol>
        <ol className="worksheet-list worksheet-letter-list">
          {section.bank.map((entry) => (
            <li key={entry.letter} className="worksheet-item">
              <span className="worksheet-number">{entry.letter}.</span>
              <div className="worksheet-item-body">{entry.text}</div>
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
            <span className="worksheet-write-line" />
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
  return section.items.map((item) => item.answer);
}

function AnswerKey({ sections }: { sections: WorksheetSection[] }) {
  return (
    <article className="worksheet-sheet worksheet-answer-key">
      <p className="worksheet-kicker">Teacher copy</p>
      <h1 className="worksheet-title">Answer key</h1>
      {sections.map((section, sectionIndex) => (
        <section key={`${section.type}-${sectionIndex}`} className="worksheet-section">
          <h2>
            {sectionIndex + 1}. {section.title}
          </h2>
          <ol className="worksheet-list worksheet-key-list">
            {answerLines(section).map((line, index) => (
              <li key={`${line}-${index}`}>
                {section.type === 'matching' ? line : `${index + 1}. ${line}`}
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
  margin: 12mm;
}
.worksheet-sheet {
  width: min(100%, 48rem);
  margin: 0 auto;
  background: white;
  color: var(--brand-navy);
  border: 4px solid var(--brand-navy);
  box-shadow: 8px 8px 0 var(--brand-navy);
  padding: 1.25rem 1.35rem 1.5rem;
  font-family: var(--font-fredoka), ui-sans-serif, system-ui, sans-serif;
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
  display: grid;
  grid-template-columns: 1.3fr 0.8fr 0.9fr;
  gap: 0.55rem 0.9rem;
  margin-bottom: 0.85rem;
}
.worksheet-field {
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  min-width: 0;
  font-size: 0.95rem;
}
.worksheet-field-label {
  font-weight: 700;
  white-space: nowrap;
}
.worksheet-field-value {
  font-weight: 600;
  border-bottom: 1.5px solid var(--brand-navy);
  min-width: 0;
  overflow-wrap: anywhere;
}
.worksheet-blank {
  flex: 1;
  border-bottom: 1.5px solid var(--brand-navy);
  min-width: 4.5rem;
  height: 1.15rem;
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
  break-inside: avoid;
  page-break-inside: avoid;
  margin-top: 1rem;
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
  gap: 0.4rem;
  align-items: flex-start;
  break-inside: avoid;
  page-break-inside: avoid;
  margin: 0.45rem 0;
}
.worksheet-number {
  font-weight: 700;
  min-width: 1.4rem;
}
.worksheet-item-body {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  line-height: 1.45;
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1.25rem;
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
  height: 1.35rem;
  margin-top: 0.15rem;
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
.worksheet-answer-key {
  margin-top: 1.5rem;
}
.worksheet-key-list li {
  margin: 0.2rem 0;
  font-weight: 600;
}
@media (max-width: 640px) {
  .worksheet-meta,
  .worksheet-choices,
  .worksheet-match {
    grid-template-columns: 1fr;
  }
}
@media print {
  body:has(.worksheet-print-root),
  .worksheet-print-root {
    background: white !important;
  }
  .worksheet-sheet {
    box-shadow: none !important;
    border-width: 2px;
    width: auto;
    max-width: none;
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

/** The shared paper layout. Any WorksheetDocument can be printed with this. */
export default function WorksheetTemplate({
  document,
  includeAnswerKey = false,
}: WorksheetTemplateProps) {
  const { header, sections } = document;
  const due = formatWorksheetDate(header.dueDate);

  return (
    <div className="worksheet-template">
      <style>{SHEET_CSS}</style>
      <article className="worksheet-sheet">
        <p className="worksheet-kicker">Englishfully worksheet{header.level ? ` · ${header.level}` : ''}</p>
        <h1 className="worksheet-title">{header.title.trim() || 'Worksheet'}</h1>
        <div className="worksheet-rule" />
        <div className="worksheet-meta">
          <Field label="Teacher">{header.teacherName}</Field>
          <Field label="Class">{header.className}</Field>
          <Field label="Date">{formatWorksheetDate(header.date)}</Field>
          <Field label="Student">{header.studentName}</Field>
          <div className="worksheet-field">
            <span className="worksheet-field-label">ID no.</span>
            <IdBoxes value={header.studentId} />
          </div>
          <Field label="Due">{due}</Field>
        </div>
        {header.instructions.trim() ? (
          <p className="worksheet-note">{header.instructions}</p>
        ) : null}
        {sections.length === 0 ? (
          <p className="worksheet-empty print:hidden">
            Your exercises will land here. The header above is the template for every worksheet.
          </p>
        ) : (
          sections.map((section, index) => (
            <SectionBlock key={`${section.type}-${index}`} section={section} index={index} />
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
