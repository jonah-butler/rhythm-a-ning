import { useState } from 'react';
import PlusIcon from '../assets/icons/plus.svg?react';
import TrashIcon from '../assets/icons/trash.svg?react';
import '../css/TagInput.css';

type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxLength?: number;
};

const sanitizeTag = (input: string, maxLength: number): string =>
  input.trim().replace(/[<>]/g, '').replace(/\s+/g, ' ').slice(0, maxLength);

export default function TagInput({
  tags,
  onChange,
  placeholder,
  maxLength = 24,
}: TagInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const clean = sanitizeTag(draft, maxLength);
    if (!clean || tags.includes(clean)) return;
    onChange([...tags, clean]);
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-col f-gap2">
      <div className="flex f-gap1">
        <input
          placeholder={placeholder}
          className="input-text"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <button
          type="button"
          className="filled small ml-4 p-2"
          disabled={!draft.trim()}
          onClick={addTag}
        >
          <PlusIcon style={{ width: '12px', height: '12px' }} />
        </button>
      </div>

      {tags?.length ? (
        <div className="flex f-gap2 flex-wrap">
          {tags.map((tag) => (
            <span key={tag} className="tag flex f-gap2 justify-center">
              <span>{tag}</span>
              <button
                type="button"
                className="color-white"
                onClick={() => removeTag(tag)}
              >
                <TrashIcon style={{ width: '12px' }} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
