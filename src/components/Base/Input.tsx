type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  required?: boolean;

  value?: string;
  onChange: (value: string) => void;
};

const Input: React.FC<InputProps> = ({ label, required, value, onChange, ...props }) => {
  return (
    <label>
      {/* <span className="pointer-events-none select-none text-gray-200">1</span> */}
      {label}
      {required && <span className="text-lg text-main-orange">*</span>}:{" "}
      <input className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black" onChange={(e) => onChange(e.target.value)} value={value} {...props} />
    </label>
  );
};

export default Input;
