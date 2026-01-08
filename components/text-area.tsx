import { TextInput } from "react-native";


type TextareaProps = {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    className?: string;
    editable?: boolean;
    numberOfLines? : number;
  };

export default function Textarea({ value, onChangeText, placeholder, className, editable = true ,numberOfLines = 10}: TextareaProps) {
    return (
        <TextInput
        className={className}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={editable}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        />
    );
}