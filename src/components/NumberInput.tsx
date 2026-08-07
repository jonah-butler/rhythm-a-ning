import '../css/NumberInput.css';

type NumberInputProps = {
  number: number;
  min?: number;
  max?: number;
  onClick: (value: number) => void;
};

export default function NumberInput({
  number,
  min = 1,
  max = Infinity,
  onClick,
}: NumberInputProps) {
  const validateInput = (input: string): void => {
    let intInput = Number(input);
    if (input === '' || intInput < min) {
      intInput = min;
    }
    const regexInteger = /^\d+$/;
    const isNumber = regexInteger.test(intInput.toString());
    if (isNumber) onClick(Number(intInput));
  };

  return (
    <>
      <button
        disabled={number <= min}
        className="mr-2 color-white"
        onClick={() => onClick(number - 1)}
      >
        &#8722;
      </button>
      <input
        className="input-number"
        type="text"
        pattern="[0-9]*"
        inputMode="numeric"
        value={number}
        onChange={(e) => onClick(Number(e.target.value))}
        onBlur={(e) => validateInput(e.target.value)}
      />
      <button
        disabled={number === max}
        className="ml-2 color-white"
        onClick={() => onClick(number + 1)}
      >
        &#43;
      </button>
    </>
  );
}
