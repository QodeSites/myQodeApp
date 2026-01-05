import React, {
    Dispatch,
    ReactNode,
    SetStateAction
} from "react";
import { Pressable, Text, View } from "react-native";


export interface AccordionProps {
    value: string[];
    onValueChange: Dispatch<SetStateAction<string[]>>;
    children: ReactNode;
}

export const Accordion = ({ value, onValueChange, children }: AccordionProps) => {
    return React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;
        return React.cloneElement(child as React.ReactElement<any>, {
            openAccordions: value,
            setOpenAccordions: onValueChange,
        });
    });
};

export interface AccordionItemProps {
    value: string;
    children: ReactNode;
    openAccordions?: string[];
    setOpenAccordions?: Dispatch<SetStateAction<string[]>>;
}

export const AccordionItem = ({
    value,
    children,
    openAccordions,
    setOpenAccordions,
}: AccordionItemProps) => {
    const open = openAccordions?.includes(value);

    return React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;
        return React.cloneElement(child as React.ReactElement<any>, {
            open,
            itemValue: value,
            openAccordions,
            setOpenAccordions,
        });
    });
};

export interface AccordionTriggerProps {
    children: ReactNode;
    open: boolean;
    itemValue: string;
    openAccordions: string[];
    setOpenAccordions: Dispatch<SetStateAction<string[]>>;
}

export const AccordionTrigger = ({
    children,
    open,
    itemValue,
    openAccordions,
    setOpenAccordions,
}: AccordionTriggerProps) => {
    const handleToggle = () => {
        if (open) {
            setOpenAccordions(openAccordions.filter((v) => v !== itemValue));
        } else {
            setOpenAccordions([...openAccordions, itemValue]);
        }
    };

    return (
        <Pressable
            onPress={handleToggle}
            hitSlop={10}
            className="flex-row items-center rounded-lg px-3 py-2.5"
        >
            <Text className="text-base font-semibold text-background">
                {children}
            </Text>
            <DropdownIcon open={open} />
        </Pressable>
    );
};

export interface AccordionContentProps {
    children: ReactNode;
    open: boolean;
}

export interface AccordionContentProps {
    children: React.ReactNode;
    open: boolean;
    className?: string;
}

export const AccordionContent = ({ children, open, className }: AccordionContentProps) =>
    open ? <View className={`pb-2 pl-3${className ? ` ${className}` : ""}`}>{children}</View> : null;

/* -------------------- Dropdown Icon -------------------- */

export interface DropdownIconProps {
    open: boolean;
}

export const DropdownIcon = ({ open }: DropdownIconProps) => (
    <Text
        style={{
            transform: [{ rotate: open ? "90deg" : "0deg" }],
        }}
        className="ml-auto text-base text-background"
    >
        ›
    </Text>
);
