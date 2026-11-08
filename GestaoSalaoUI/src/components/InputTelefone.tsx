import { InputText, InputTextProps } from "primereact/inputtext";

import { mascaraTelefone, somenteDigitos } from "../utilities/formatters";

interface Props extends Omit<InputTextProps, "value" | "onChange"> {
  value: string;
  onChange: (digitos: string) => void;
}

// Mostra com máscara, mas devolve só os números
export default function InputTelefone({ value, onChange, placeholder = "(00) 0 0000-0000", ...resto }: Props) {
  return (
    <InputText
      {...resto}
      value={mascaraTelefone(value)}
      onChange={(e) => onChange(somenteDigitos(e.target.value))}
      placeholder={placeholder}
      inputMode="tel"
      autoComplete="tel"
    />
  );
}
