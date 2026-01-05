import { tokenStorage } from '@/api/auth/tokenStorage';
import { api } from "@/api/axios";
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Use Expo Router for navigation instead of @react-navigation/native
import { useClient } from '@/context/ClientContext';
import { useRouter } from 'expo-router';

type LoginStep = 'username' | 'password' | 'otp-verification' | 'password-setup' | 'dev-bypass';

const isDevelopment = process.env.NODE_ENV === 'development';

export default function LoginScreen() {
  const router = useRouter(); // Expo Router instance

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [currentStep, setCurrentStep] = useState<LoginStep>('username');
  const [userEmail, setUserEmail] = useState('');
  const [requirePasswordSetup, setRequirePasswordSetup] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fpOpen, setFpOpen] = useState(false);
  const [fpEmail, setFpEmail] = useState('');
  const [fpSending, setFpSending] = useState(false);
  const [fpMsg, setFpMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const {refresh} = useClient()

  const passwordStrength = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    numbers: /\d/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };
  const isPasswordValid = isDevelopment
    ? newPassword.length > 0 && confirmPassword.length > 0
    : Object.values(passwordStrength).every(Boolean);

  // Expo Router navigation helper
  function goToRoute(route: string) {
    if (route === 'DistributorFees') {
      router.replace('/(investor)/portfolio/performance');
    } else if (route === 'PortfolioPerformance') {
      router.replace('/(investor)/portfolio/performance');
    } 
  }

  const checkPasswordStatus = async () => {
    if (!username.trim()) {
      setError('Please enter your email or Account ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data } = await api.post('/api/auth/login', {
        action: 'check-password-status',
        username: username.trim(),
      });

      if (data.error) {
        throw new Error(data.error || 'Failed to check password status');
      }

      if (data.requirePasswordSetup) {
        setRequirePasswordSetup(true);
        setUserEmail(data.email);
        setCurrentStep('username');
        setError('Password setup required. Click "Send Verification Code" to continue.');
      } else {
        setCurrentStep('password');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to check password status');
    } finally {
      setIsLoading(false);
    }
  };

  const devBypassLogin = async () => {
    if (!userEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        action: 'dev-bypass-login',
        username: userEmail.trim(),
      });

      const data = response.data;
      if (data.error) {
        throw new Error(data.error || 'Dev bypass login failed');
      }
      await refresh();
      goToRoute(data.clientType === "DISTRIBUTORS" ? 'DistributorFees' : 'PortfolioPerformance');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Dev bypass login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const sendSetupOtp = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (isDevelopment) {
        setOtp('000000');
        setCurrentStep('password-setup');
        return;
      }

      const res = await api.post('/api/auth/send-setup-otp', {
        email: userEmail,
      });
      const data = res.data;

      if (!data.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setCurrentStep('otp-verification');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        action: 'verify-setup-otp',
        username: userEmail,
        otp: otp.trim(),
      });
      const data = response.data;

      if (!data.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }
      setCurrentStep('password-setup');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const completePasswordSetup = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        action: 'complete-password-setup',
        username: userEmail,
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });

      const data = response.data;

      if (!data || data.error) {
        throw new Error(data?.error || 'Password setup failed');
      }
      await refresh();
      goToRoute(data.clientType === "DISTRIBUTORS" ? 'DistributorFees' : 'PortfolioPerformance');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Password setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegularLogin = async () => {
    if (!isDevelopment && (!username || !password)) {
      setError('Username and password are required');
      return;
    }

    if (!username) {
      setError('Please enter your email or Account ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        username,
        password: isDevelopment ? '' : password,
      });

      const data = response.data;

      if (!data.success) throw new Error(data.error || 'Login failed');
      await tokenStorage.setAccess(data.accessToken);
      await refresh();

      goToRoute(data.clientType === "DISTRIBUTORS" ? 'DistributorFees' : 'PortfolioPerformance');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    if (currentStep === 'password') {
      setCurrentStep('username');
      setPassword('');
    } else if (currentStep === 'otp-verification') {
      setCurrentStep('username');
      setOtp('');
      setRequirePasswordSetup(false);
      setUserEmail('');
    } else if (currentStep === 'password-setup') {
      setCurrentStep('otp-verification');
      setNewPassword('');
      setConfirmPassword('');
    } else if (currentStep === 'dev-bypass') {
      setCurrentStep('username');
      setUserEmail('');
    }
  };

  const handleForgotSubmit = async () => {
    setFpMsg(null);
    setFpSending(true);
    try {
      const resp = await api.post('/api/auth/forgot', { email: fpEmail.trim() });
      const data = resp.data;

      if (!data.ok) {
        throw new Error(data.error || 'Could not send reset email');
      }

      setFpMsg({
        type: 'success',
        text: 'If that email exists, a reset link has been sent. Be sure to check your email',
      });

      setTimeout(() => {
        closeForgot();
      }, 2000);
    } catch (err: any) {
      setFpMsg({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setFpSending(false);
    }
  };

  const closeForgot = () => {
    setFpOpen(false);
    setFpMsg(null);
    setFpEmail('');
  };

  // UI helpers
  const getStepTitle = () => {
    switch (currentStep) {
      case 'username': return 'Welcome!';
      case 'password': return 'Enter Password';
      case 'otp-verification': return 'Email Verification';
      case 'password-setup': return 'Set Your Password';
      case 'dev-bypass': return 'Dev Mode Login';
      default: return 'Welcome!';
    }
  };

  const getStepIcon = () => {
    let iconProps = { size: 24 };
    switch (currentStep) {
      case 'username': return <Feather name="mail" {...iconProps} />;
      case 'password': return <Feather name="lock" {...iconProps} />;
      case 'otp-verification': return <Feather name="shield" {...iconProps} />;
      case 'password-setup': return <Feather name="lock" {...iconProps} />;
      case 'dev-bypass': return <Feather name="zap" size={24} color="#ffbe3d" />;
      default: return <Feather name="mail" {...iconProps} />;
    }
  };

  // Layout
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow">
        <View className="flex-1 items-center justify-center min-h-screen px-4 gap-3">
          <View
            className="flex flex-row items-end mb-1 font-serif text-7xl font-bold h-content text-primary"
          >
            <Text className="font-serif text-2xl font-[600] text-primary" style={{ lineHeight: 44 }}>
              my
            </Text>
            <Text className="font-serif text-6xl font-[600] text-primary" style={{ lineHeight: 64 }}>
              Qode
            </Text>
          </View>
          <View className="bg-card rounded-xl shadow-md p-6 w-full max-w-md">
            {/* Header */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between">
                {currentStep !== 'username' ?
                  <TouchableOpacity
                    onPress={goBack}
                    disabled={isLoading}
                    className="w-9 h-9 items-center justify-center rounded-full"
                  >
                    <Feather name="arrow-left" size={20}/>
                  </TouchableOpacity>
                  : <View className="w-9" />}
                <View className="flex-1 items-center text-primary color-primary">
                  {getStepIcon()}
                </View>
                <View className="w-9" />
              </View>
              <Text className="text-xl font-semibold font-sans text-primary text-center mt-3">
                {getStepTitle()}
              </Text>
              {currentStep === 'otp-verification' &&
                <Text className="text-center text-xs text-primary">We've sent a verification code to {userEmail}</Text>}
              {isDevelopment && currentStep === 'password-setup' &&
                <Text className="text-xs text-yellow-600 text-center">Development mode: Password validation skipped</Text>}
              {isDevelopment && currentStep === 'dev-bypass' &&
                <Text className="text-xs text-yellow-600 text-center">Development mode: Bypass any email</Text>}
            </View>

            {error ? <Text className="bg-[#ffeaea] border border-[#EF4444] text-[#B91C1C] px-3 py-2 mb-2 rounded text-sm text-center">{error}</Text> : null}

            {/* Username Step */}
            {currentStep === 'username' && (
              <View className="flex flex-col space-y-4 gap-2">
                <View className='flex gap-1'>
                  <Text className="font-medium text-primary text-sm mb-1">Email or Account ID</Text>
                  <TextInput
                    className="bg-input border rounded px-4 py-2 text-base"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    value={username}
                    onChangeText={val => setUsername(val.includes('@') ? val.toLowerCase() : val)}
                    placeholder="you@example.com or Account ID"
                    editable={!isLoading && !requirePasswordSetup}
                    onSubmitEditing={() => !requirePasswordSetup && checkPasswordStatus()}
                  />
                </View>
                {!requirePasswordSetup ? (
                  <TouchableOpacity
                    className={`bg-primary rounded py-3 items-center ${isLoading || !username.trim() ? "opacity-50" : ""}`}
                    onPress={checkPasswordStatus}
                    disabled={isLoading || !username.trim()}
                  >
                    {isLoading ?
                      <ActivityIndicator color="white" /> :
                      <Text className="font-bold text-accent">Continue</Text>
                    }
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text className="bg-background border border text-accent font-sans px-3 py-2 text-center rounded mb-2">
                      Password setup required for {userEmail}
                    </Text>
                    <TouchableOpacity
                      className={`bg-primary rounded py-3 items-center ${isLoading ? "opacity-50" : ""}`}
                      onPress={sendSetupOtp}
                      disabled={isLoading}
                    >
                      {isLoading ?
                        <ActivityIndicator color="white" /> :
                        <Text className="text-white font-bold">
                          {isDevelopment ? 'Continue to Setup' : 'Send Verification Code'}
                        </Text>
                      }
                    </TouchableOpacity>
                  </>
                )}

                {/* Dev Mode Bypass Button */}
                {isDevelopment && !requirePasswordSetup && (
                  <TouchableOpacity
                    className={`flex-row items-center justify-center border border-yellow-400 rounded py-2 bg-yellow-50 mt-2 ${isLoading ? "opacity-50" : ""}`}
                    onPress={() => {
                      setCurrentStep('dev-bypass');
                      setUserEmail('');
                      setError('');
                    }}
                    disabled={isLoading}
                  >
                    <Feather name="zap" size={20} color="#ffbe3d" />
                    <Text className="ml-2 text-yellow-700 font-medium">Dev Mode: Bypass Login</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Password Step */}
            {currentStep === 'password' && (
              <View className="flex flex-col gap-2 space-y-4">
                <View>
                  <Text className="font-medium font-sans text-primary text-sm mb-1">Account</Text>
                  <TextInput
                    className="bg-input border rounded px-4 py-2 text-base"
                    value={username}
                    editable={false}
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <View className="flex-row justify-between items-center">
                    <Text className="font-medium text-sm font-sans text-primary">Password</Text>
                    {isDevelopment ?
                      <Text className="text-xs ml-2 text-[#ffbe3d]">(optional in dev)</Text> : null}
                  </View>
                  <View className="relative flex-row items-center">
                    <TextInput
                      className="flex-1 bg-input border rounded px-4 py-2 text-base pr-10"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      autoCapitalize='none'
                      placeholder={isDevelopment ? "Leave blank in dev mode (optional)" : "Enter your password"}
                      editable={!isLoading}
                      autoComplete="password"
                      onSubmitEditing={handleRegularLogin}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      style={{
                        position: "absolute",
                        right: 10,
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    >
                      <Feather name={showPassword ? "eye-off" : "eye"} size={20} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setFpOpen(true)} 
                    disabled={isLoading}
                    className="self-end mt-1"
                  >
                    <Text className="text-xs text-primary">Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                {isDevelopment &&
                  <View className="bg-yellow-50 px-2 py-1 rounded">
                    <Text className="text-[#ffbe3d] text-xs">
                      Development Mode: Leave password blank to log in instantly
                    </Text>
                  </View>}
                <TouchableOpacity
                  className={`bg-primary rounded py-3 items-center ${isLoading ? "opacity-50" : ""}`}
                  onPress={handleRegularLogin}
                  disabled={isLoading}
                >
                  {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Sign In</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* OTP Verification Step */}
            {currentStep === 'otp-verification' && (
              <View className="flex flex-col space-y-4">
                <View>
                  <Text className="font-medium font-sans text-primary  text-sm mb-1">Verification Code</Text>
                  <TextInput
                    className="bg-input border rounded px-4 py-2 text-center tracking-widest text-lg"
                    maxLength={6}
                    value={otp}
                    keyboardType="numeric"
                    onChangeText={val => setOtp(val.replace(/\D/g, ''))}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    editable={!isLoading}
                    onSubmitEditing={verifyOtp}
                  />
                </View>

                <TouchableOpacity
                  onPress={sendSetupOtp}
                  disabled={isLoading}
                  className="self-end mb-3"
                >
                  <Text className="text-primary text-sm">Resend code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`bg-primary rounded py-3 items-center ${isLoading || otp.length !== 6 ? "opacity-50" : ""}`}
                  onPress={verifyOtp}
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Verify Code</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Password Setup Step */}
            {currentStep === 'password-setup' && (
              <View className="flex flex-col space-y-4">
                <View>
                  <Text className="font-medium font-sans text-primary text-sm mb-1">New Password</Text>
                  <View className="flex-row items-center space-x-2">
                    <TextInput
                      className="flex-1 bg-input border border-[#e6e6eb] rounded px-4 py-2 text-base"
                      value={newPassword}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize='none'
                      placeholder="Create a strong password"
                      editable={!isLoading}
                      autoComplete="password"
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                    >
                      <Feather name={showNewPassword ? "eye-off" : "eye"} size={20} color="#0060f0" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View>
                  <Text className="font-medium font-sans text-primary text-sm mb-1">Confirm Password</Text>
                  <View className="flex-row items-center space-x-2">
                    <TextInput
                      className="flex-1 bg-input border rounded px-4 py-2 text-base"
                      value={confirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize='none'
                      placeholder="Confirm your password"
                      editable={!isLoading}
                      autoComplete="password"
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#0060f0" />
                    </TouchableOpacity>
                  </View>
                </View>
                {!isDevelopment && (
                  <View className="mt-1 mb-1">
                    <Text className="text-xs text-[#788]">Password must contain:</Text>
                    <View className="mt-1 ml-3">
                      <Text className={`text-xs ${passwordStrength.length ? 'text-green-700' : 'text-[#EF4444]'}`}>• At least 8 characters</Text>
                      <Text className={`text-xs ${passwordStrength.uppercase ? 'text-green-700' : 'text-[#EF4444]'}`}>• Uppercase letter</Text>
                      <Text className={`text-xs ${passwordStrength.lowercase ? 'text-green-700' : 'text-[#EF4444]'}`}>• Lowercase letter</Text>
                      <Text className={`text-xs ${passwordStrength.numbers ? 'text-green-700' : 'text-[#EF4444]'}`}>• Number</Text>
                      <Text className={`text-xs ${passwordStrength.special ? 'text-green-700' : 'text-[#EF4444]'}`}>• Special character</Text>
                    </View>
                  </View>
                )}
                <TouchableOpacity
                  onPress={completePasswordSetup}
                  disabled={isLoading || !newPassword || !confirmPassword || (!isDevelopment && !isPasswordValid)}
                  className={`bg-primary rounded py-3 items-center ${(isLoading || !newPassword || !confirmPassword || (!isDevelopment && !isPasswordValid)) ? "opacity-50" : ""}`}
                >
                  {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Complete Setup & Sign In</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Dev Bypass Step */}
            {currentStep === 'dev-bypass' && (
              <View className="flex flex-col space-y-4">
                <View className="bg-yellow-50 px-2 py-1 rounded">
                  <Text className="text-accent text-xs">
                    <Text className="font-bold">Development mode:</Text> Enter any email address to bypass authentication
                  </Text>
                </View>
                <View>
                  <Text className="font-medium font-sans text-primary text-sm mb-1">Email Address</Text>
                  <TextInput
                    className="bg-input border rounded px-4 py-2 text-base"
                    autoCapitalize="none"
                    value={userEmail}
                    onChangeText={val => setUserEmail(val.includes('@') ? val.toLowerCase() : val)}
                    placeholder="any@example.com"
                    editable={!isLoading}
                    autoComplete="email"
                    onSubmitEditing={devBypassLogin}
                  />
                </View>
                <TouchableOpacity
                  onPress={devBypassLogin}
                  disabled={isLoading || !userEmail.trim()}
                  className={`flex-row items-center justify-center bg-[#cfab11] rounded py-3 ${isLoading || !userEmail.trim() ? "opacity-50" : ""}`}
                >
                  <Feather name="zap" size={18} color="white" />
                  <Text className="text-white font-bold">{isLoading ? ' Logging In...' : ' Login'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text className="text-center text-[11px] text-[#789] my-6">
            © 2025 Qode Advisors LLP | SEBI Registered PMS No: INP000008914 | All Rights Reserved
          </Text>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={fpOpen}
        onRequestClose={closeForgot}
      >
        <View className="flex-1 justify-center items-center bg-black/30">
          <View className="bg-white rounded-xl p-6 w-11/12 max-w-md mx-auto">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-bold text-lg">Reset your password</Text>
              <TouchableOpacity onPress={closeForgot} className="w-8 h-8 items-center justify-center rounded-full">
                <Feather name="x" size={20} color="#888" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-[#789] mb-3">
              Enter your account email. If it exists, we'll send a reset link.
            </Text>
            {fpMsg && (
              <View className={`px-3 py-2 mb-2 rounded border ${fpMsg.type === 'success' ? 'bg-[#e8fae9] border-[#34D399]' : 'bg-[#ffeaea] border-[#EF4444]'}`}>
                <Text className={`text-sm ${fpMsg.type === 'success' ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>{fpMsg.text}</Text>
              </View>
            )}
            <View>
              <Text className="font-medium font-sans text-primary text-sm mb-1">Email</Text>
              <TextInput
                className="bg-input border rounded px-4 py-2 text-base"
                autoCapitalize="none"
                value={fpEmail}
                onChangeText={val => setFpEmail(val.includes('@') ? val.toLowerCase() : val)}
                placeholder="you@example.com"
                editable={!fpSending}
                autoComplete="email"
                keyboardType="email-address"
              />
            </View>
            <View className="flex-row mt-1 mb-1">
              <TouchableOpacity
                onPress={closeForgot}
                className="flex-1 items-center py-2 rounded bg-[#eee] mr-2"
                disabled={fpSending}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleForgotSubmit}
                className="flex-1 items-center py-2 rounded bg-primary"
                disabled={fpSending || !fpEmail.trim()}
              >
                <Text className="text-white font-bold">
                  {fpSending ? "Sending..." : "Send reset link"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="mt-1 text-[11px] text-[#889] text-center">
              Tip: The email may take a minute. Also check your spam folder.
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
