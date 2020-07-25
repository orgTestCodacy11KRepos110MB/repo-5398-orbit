import isEmail from "isemail";
import React from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";
import * as colors from "../styles/colors";
import { borderRadius, gridUnit, spacing } from "../styles/layout";
import type from "../styles/type";
import BigButton from "./BigButton";
import Spacer from "./Spacer";

export interface SignInFormProps {
  mode: null | "signIn" | "register";
  onChangeEmail: (email: string) => void;
  onSubmit: (email: string, password: string) => void;
  isPendingServerResponse: boolean;
}

export default function SignInForm({
  onSubmit,
  mode,
  onChangeEmail,
  isPendingServerResponse,
}: SignInFormProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const hasValidFormEntries = React.useMemo(() => {
    if (!email || !password) {
      return false;
    }
    return isEmail.validate(email);
  }, [email, password]);

  const buttonEnabled = React.useMemo(() => {
    return hasValidFormEntries && !isPendingServerResponse && mode !== null;
  }, [hasValidFormEntries, isPendingServerResponse, mode]);

  const onPress = React.useCallback(() => {
    onSubmit(email, password);
  }, [onSubmit, email, password]);

  const emailInputRef = React.useRef<TextInput>(null);
  const onSubmitEmail = React.useCallback(() => {
    emailInputRef.current?.focus();
  }, []);

  const onSubmitPassword = React.useCallback(() => {
    if (buttonEnabled) {
      onPress();
    }
  }, [onPress, buttonEnabled]);

  const onBlurEmail = React.useCallback(() => {
    onChangeEmail(email);
  }, [email, onChangeEmail]);

  const buttonTitle =
    mode === null
      ? "Sign in or create account"
      : mode === "signIn"
      ? "Sign in"
      : "Create account";

  return (
    <View>
      <Spacer units={1} />
      <TextInput
        onChangeText={setEmail}
        value={email}
        placeholder="Email address"
        autoCorrect={false}
        style={styles.textInput}
        importantForAutofill="yes"
        autoCompleteType="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        onSubmitEditing={onSubmitEmail}
        onBlur={onBlurEmail}
        returnKeyType={"next"}
      />
      <Spacer units={1} />
      <TextInput
        ref={emailInputRef}
        onChangeText={setPassword}
        autoCompleteType="password"
        textContentType="newPassword"
        autoCorrect={false}
        value={password}
        secureTextEntry={true}
        placeholder="Password"
        importantForAutofill="yes"
        style={styles.textInput}
        onSubmitEditing={onSubmitPassword}
        returnKeyLabel={mode ? buttonTitle : undefined}
        returnKeyType={buttonEnabled ? "done" : undefined}
      />
      <Spacer units={1} />
      <BigButton
        title={buttonTitle}
        onPress={onPress}
        disabled={!buttonEnabled}
      />
      <Spacer units={1} />
      <ActivityIndicator
        animating={
          isPendingServerResponse || (hasValidFormEntries && mode === null)
        }
        color={colors.key50}
      />
      <Spacer units={1} />
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    ...type.label,
    height: gridUnit * 3,
    backgroundColor: "white",
    paddingLeft: spacing.spacing04,
    borderRadius,
  },

  row: {
    flexDirection: "row",
  },

  label: { ...type.label },
});
