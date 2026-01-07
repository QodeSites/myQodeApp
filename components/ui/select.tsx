import { ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

type SelectContextProps = {
  open: boolean;
  setOpen: (o: boolean) => void;
  value: string;
  setValue: (v: string) => void;
  onValueChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

const SelectContext = React.createContext<SelectContextProps>({
  open: false,
  setOpen: () => {},
  value: "",
  setValue: () => {},
  onValueChange: undefined,
  placeholder: undefined,
  disabled: false,
});

export function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  placeholder = "Select an option",
  disabled = false,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const setValue = (v: string) => {
    if (!isControlled) setUncontrolledValue(v);
    if (onValueChange) onValueChange(v);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        open,
        setOpen,
        value,
        setValue,
        onValueChange,
        placeholder,
        disabled,
      }}
    >
      <View className={`h-10 ${className}`}>
        {children}
      </View>
    </SelectContext.Provider>
  );
}

type SelectTriggerProps = {
  className?: string;
  children?: React.ReactNode;
};

export function SelectTrigger({ className = "", children }: SelectTriggerProps) {
  const { open, setOpen, value, disabled } = React.useContext(SelectContext);

  return (
    <Pressable
      className={`p-2 select-trigger${open ? " select-trigger-open" : ""}${disabled ? " select-trigger-disabled" : ""} ${className}`}
      onPress={() => !disabled && setOpen(true)}
      disabled={disabled}
    >
      <View className={`flex flex-row flex-1 items-center`}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className={`flex-1 text-base ${!value ? "text-muted-foreground" : "text-foreground"}`}
        >
          {children}
        </Text>
        <ChevronDown size={18} color={"#8a8a8a"} />
      </View>
    </Pressable>
  );
}

type SelectValueProps = { 
  placeholder?: string; 
  className?: string;
  formatValue?: (value: string) => string;
};

export function SelectValue({ placeholder, className = "", formatValue }: SelectValueProps) {
  const { value, placeholder: ctxPlaceholder } = React.useContext(SelectContext);
  const displayValue = value ? (formatValue ? formatValue(value) : value) : (placeholder || ctxPlaceholder || "");
  return (
    <Text
      className={`text-base ${!value ? "text-muted-foreground" : "text-foreground"} ${className}`}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {displayValue}
    </Text>
  );
}

type SelectContentProps = {
  children: React.ReactNode;
  className?: string;
  flatListProps?: any;
  maxHeight?: number;
};

export function SelectContent({ children, className = "", flatListProps, maxHeight = 320 }: SelectContentProps) {
  const { open, setOpen, disabled } = React.useContext(SelectContext);

  if (!open || disabled) return null;

  let items: any[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) items.push(child);
  });

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <Pressable
        className={`flex-1 bg-black/15 justify-center items-center`}
        onPress={() => setOpen(false)}
      >
        <View
          className={`w-5/6 max-w-[360px] rounded-xl bg-popover border border-border shadow-xl py-2 ${className}`}
          style={{ maxHeight }}
        >
          <FlatList
            data={items}
            keyExtractor={(_, idx) => "" + idx}
            renderItem={({ item }) => item}
            showsVerticalScrollIndicator={false}
            {...flatListProps}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

type SelectItemProps = {
  value: string;
  label?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export function SelectItem({
  value: itemValue,
  label,
  children,
  disabled,
  className = "",
}: SelectItemProps) {
  const { value, setValue } = React.useContext(SelectContext);
  const selected = value === itemValue;

  return (
    <Pressable
      className={`px-5 py-3 flex flex-row items-center ${selected ? "bg-accent/50" : "bg-transparent"} ${disabled ? "opacity-40" : ""} ${className}`}
      onPress={() => !disabled && setValue(itemValue)}
      disabled={disabled}
    >
      <Text
        className={`flex-1 text-base ${selected ? "text-accent-foreground font-bold" : "text-foreground"}`}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {children || label || itemValue}
      </Text>
      {selected ? (
        <View className={`ml-2 w-4 h-4 rounded-full bg-accent`} />
      ) : null}
    </Pressable>
  );
}

