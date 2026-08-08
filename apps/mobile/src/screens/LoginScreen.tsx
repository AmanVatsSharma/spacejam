/**
 * File:        apps/mobile/src/screens/LoginScreen.tsx
 * Module:      Mobile · Screens · Login
 * Purpose:     Two-step login (email/password → OTP) with GraphQL auth
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-07
 */
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  Animated,
  Easing,
  ToastAndroid,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { apolloClient } from '../lib/apollo/client';
import { SIGNIN_MUTATION, VERIFY_TWO_FACTOR_MUTATION } from '../lib/apollo/operations';
import { useAuth } from '../lib/auth/context';

// ─── Tokens ────────────────────────────────────────────────────────────────────
import {
  palette,
  space,
  radius,
  elevation,
  type as typeScale,
  easing,
  duration,
  pressScale,
} from '../theme/tokens';
import { useFadeIn, usePressFeedback, staggerDelay } from '../theme/animations';

const { width: SW } = Dimensions.get('window');

// ─── Decorative Square Component ──────────────────────────────────────────────
interface BoxProps {
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  filled?: boolean;
  opacity?: number;
}

const Box = ({ size, top, left, right, bottom, filled = true, opacity = 1 }: BoxProps) => (
  <View
    style={[
      {
        position: 'absolute',
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        opacity,
        borderRadius: radius.sm,
        backgroundColor: filled ? palette.brand : 'transparent',
        borderWidth: filled ? 0 : 1.5,
        borderColor: palette.brand,
      },
    ]}
  />
);

// ─── Animated Input Wrapper ────────────────────────────────────────────────────
const AnimatedInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  index = 0,
  toggleSecure,
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  autoComplete?: any;
  index?: number;
  toggleSecure?: () => void;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.99, speed: 80 });

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: duration.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: duration.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.borderSoft, palette.brand],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.18],
  });

  return (
    <Animated.View
      style={[
        styles.inputWrapper,
        {
          borderColor,
          shadowOpacity,
          shadowColor: palette.brand,
          backgroundColor: isFocused ? palette.surface : palette.surfaceSub,
        },
      ]}
    >
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#B0BEC5"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {toggleSecure && (
        <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={toggleSecure}>
          <Animated.View style={{ transform: [{ scale: pressIn ? 0.9 : 1 }] }}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B0BEC5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {secureTextEntry ? (
                <>
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <Path d="M12 9a3 3 0 100 6 3 3 0 100-6z" />
                </>
              ) : (
                <>
                  <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <Path d="M1 1l22 22" />
                </>
              )}
            </Svg>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </Animated.View>
  );
};

// ─── Main Login Screen Component ──────────────────────────────────────────────

// DEV MODE: when true, any email/password reaches the OTP step and ANY 6-digit
// OTP (e.g. 000000, 123456) logs into the dashboard — no real backend needed.
// Set to false once the live API is wired and you want real 2FA enforcement.
const DEV_ANY_OTP = true;

export default function LoginScreen() {
  const navigation = useNavigation();
  const authContext = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Animated values ─────────────────────────────────────────────────────────
  const loginViewAnim = useRef(new Animated.Value(1)).current;
  const otpViewAnim = useRef(new Animated.Value(0)).current;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const otpInputs = useRef<Array<TextInput | null>>([]);

  // ── Challenge token storage for 2FA ────────────────────────────────────────
  const challengeTokenRef = useRef<string | null>(null);

  // ── Animation helpers ──────────────────────────────────────────────────────
  const transitionToOtp = () => {
    setShowOtp(true);
    Animated.parallel([
      Animated.timing(loginViewAnim, {
        toValue: 0,
        duration: duration.normal,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(otpViewAnim, {
        toValue: 1,
        duration: duration.normal,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const transitionToLogin = () => {
    Animated.parallel([
      Animated.timing(loginViewAnim, {
        toValue: 1,
        duration: duration.normal,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(otpViewAnim, {
        toValue: 0,
        duration: duration.normal,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowOtp(false);
      setOtp(['', '', '', '', '', '']);
    });
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) {
      ToastAndroid.show('Please enter a valid phone number', ToastAndroid.SHORT);
      return;
    }

    // DEV: any phone number goes straight to OTP entry — no real OTP is sent.
    if (DEV_ANY_OTP) {
      transitionToOtp();
      return;
    }

    // PROD path: request OTP for the phone number via the backend.
    setLoading(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: SIGNIN_MUTATION,
        variables: { email: `${digits}@phone.spacejam`, password: 'phone-otp' },
      });

      const result = data?.signin;
      if (result?.twoFactorRequired) {
        challengeTokenRef.current = result.challengeToken;
        transitionToOtp();
      } else if (result) {
        const user = result.user;
        await authContext.login(
          { id: user.id, email: user.email, name: user.name, role: user.role },
          result.accessToken,
          result.refreshToken,
        );
        navigation.navigate('HomeTab' as never);
      } else {
        ToastAndroid.show('Could not send OTP', ToastAndroid.SHORT);
      }
    } catch (error: any) {
      ToastAndroid.show(error?.message || 'Could not send OTP', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');

    if (code.length !== 6) {
      ToastAndroid.show('Please enter the full 6-digit code', ToastAndroid.SHORT);
      return;
    }

    // DEV: any 6-digit OTP logs in with a mock user — no real 2FA backend needed.
    if (DEV_ANY_OTP) {
      setLoading(true);
      try {
        await authContext.login(
          {
            id: 'dev-user-1',
            email: `${phone.replace(/\D/g, '')}@phone.spacejam`,
            name: 'Dev User',
            role: 'ADMIN',
          },
          'dev-access-token',
          'dev-refresh-token',
        );
        navigation.navigate('HomeTab' as never);
      } catch (error: any) {
        ToastAndroid.show(error?.message || 'Dev login failed', ToastAndroid.SHORT);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: VERIFY_TWO_FACTOR_MUTATION,
        variables: {
          challengeToken: challengeTokenRef.current,
          code,
        },
      });

      const result = data?.verifyTwoFactor;
      if (!result) {
        ToastAndroid.show('Invalid OTP code', ToastAndroid.SHORT);
        setLoading(false);
        return;
      }

      const user = result.user;
      await authContext.login(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        result.accessToken,
        result.refreshToken,
      );
      navigation.navigate('HomeTab' as never);
    } catch (error: any) {
      ToastAndroid.show(error?.message || 'OTP verification failed', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = () => {
    navigation.navigate('HomeTab' as never);
  };

  // ── OTP helpers ─────────────────────────────────────────────────────────────
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance
    if (text && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.mainContainer}>
          {/* ── Decorative Header Area ── */}
          <View style={styles.heroSection}>
            {/* Top-left cluster */}
            <Box size={90} top={-10} left={-14} opacity={0.85} />
            <Box size={58} top={10} left={86} opacity={0.6} />
            <Box size={70} top={72} left={-14} opacity={0.55} />
            <Box size={40} top={80} left={60} filled={false} opacity={0.7} />
            <Box size={28} top={145} left={-14} opacity={0.7} />
            <Box size={44} top={140} left={18} opacity={0.45} />

            {/* Left vertical accent bar */}
            <View style={styles.leftBar} />

            {/* Left outline box */}
            <Box size={68} top={220} left={10} filled={false} opacity={0.55} />

            {/* Right-side cluster */}
            <Box size={80} top={-12} right={-30} opacity={0.65} />
            <Box size={52} top={68} right={-14} opacity={0.50} />
            <Box size={90} top={160} right={-36} opacity={0.80} />
            <Box size={70} top={200} right={-14} opacity={0.60} />
            <Box size={55} top={265} right={-14} opacity={0.40} />
            <Box size={44} top={190} right={54} filled={false} opacity={0.50} />

            {/* Brand */}
            <View style={styles.brandArea}>
              <Animated.Text style={[styles.brandLine1, { opacity: loginViewAnim }]}>SPACE</Animated.Text>
              <View style={styles.brandRow}>
                <Animated.Text style={[styles.brandLine2, { opacity: loginViewAnim }]}>JAM</Animated.Text>
                <Animated.Text style={[styles.brandTagline, { opacity: loginViewAnim }]}>{'co-working\noffices'}</Animated.Text>
              </View>
            </View>
          </View>

          {/* ── Login / OTP Card ── */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              {/* LOGIN VIEW */}
              <Animated.View
                style={{
                  flex: 1,
                  opacity: loginViewAnim,
                  position: showOtp ? 'absolute' : 'relative',
                  inset: showOtp ? 0 : undefined,
                  padding: showOtp ? 20 : undefined,
                }}
              >
                {showOtp ? null : (
                  <PhoneLoginContent
                    phone={phone}
                    onPhoneChange={setPhone}
                    onSendOtp={handleSendOtp}
                    loading={loading}
                  />
                )}
              </Animated.View>

              {/* OTP VIEW */}
              <Animated.View style={{ flex: 1, opacity: otpViewAnim, position: 'absolute', inset: 0, padding: 20 }}>
                {showOtp && (
                  <OtpContent
                    otp={otp}
                    otpInputs={otpInputs}
                    onOtpChange={handleOtpChange}
                    onOtpKeyPress={handleOtpKeyPress}
                    onVerify={handleVerifyOtp}
                    onBackToLogin={transitionToLogin}
                    loading={loading}
                    phoneNumber={phone}
                  />
                )}
              </Animated.View>

              {/* Dev bypass — always visible (works in release builds) */}
              {DEV_ANY_OTP && (
                <TouchableWithoutFeedback onPress={handleDevBypass}>
                  <Animated.View style={styles.devBypass}>
                    <Text style={styles.devBypassText}>{'🔫'}  Dev Bypass — skip login</Text>
                  </Animated.View>
                </TouchableWithoutFeedback>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Phone Login Content ──────────────────────────────────────────────────────

const PhoneLoginContent = ({
  phone,
  onPhoneChange,
  onSendOtp,
  loading,
}: {
  phone: string;
  onPhoneChange: (t: string) => void;
  onSendOtp: () => void;
  loading: boolean;
}) => {
  const { opacity: titleOp, translateY: titleY } = useFadeIn(0, { fromY: 8 });
  const { opacity: phoneOp } = useFadeIn(staggerDelay(1, 0, 60), { fromY: 8 });
  const { opacity: hintOp } = useFadeIn(staggerDelay(2, 0, 60), { fromY: 8 });
  const { opacity: btnOp } = useFadeIn(staggerDelay(3, 0, 80), { fromY: 12 });

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      {/* Title */}
      <Animated.View style={{ opacity: titleOp, transform: [{ translateY: titleY }] }}>
        <Text style={styles.cardTitle}>Welcome to SpaceJam</Text>
      </Animated.View>

      {/* Phone */}
      <Animated.View style={{ opacity: phoneOp }}>
        <Text style={styles.inputLabel}>Phone number</Text>
        <AnimatedInput
          placeholder="+91 98765 43210"
          value={phone}
          onChangeText={onPhoneChange}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoComplete="tel"
          index={1}
        />
      </Animated.View>

      {/* Hint */}
      <Animated.View style={{ opacity: hintOp }}>
        <Text style={styles.magicText}>We'll text you a 6-digit verification code.</Text>
      </Animated.View>

      <Animated.View style={{ flex: 1, minHeight: 8, opacity: btnOp }}>
        <AnimatedButton
          label={loading ? 'Sending...' : 'Send OTP'}
          onPress={onSendOtp}
          style={styles.signInBtn}
          labelStyle={styles.signInLabel}
          disabled={loading}
        />
      </Animated.View>

      {/* Footer */}
      <Animated.View style={{ opacity: btnOp }}>
        <View style={[styles.footer, { marginTop: 8 }]}>
          <Text style={styles.footerText}>By continuing you agree to our </Text>
          <Text style={styles.footerLink}>Terms</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── OTP Content ───────────────────────────────────────────────────────────────

const OtpContent = ({
  otp,
  otpInputs,
  onOtpChange,
  onOtpKeyPress,
  onVerify,
  onBackToLogin,
  loading,
  phoneNumber,
}: any) => {
  const { opacity, translateY } = useFadeIn(0, { fromY: 12 });
  const { pressIn: backPressIn, pressOut: backPressOut } = usePressFeedback({ scale: 0.96 });

  const maskedPhone = phoneNumber
    ? phoneNumber.replace(/\d(?=\d{2})/g, '•')
    : 'your phone';

  return (
    <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity, transform: [{ translateY }] }}>
      <Text style={styles.cardTitle}>Enter Verification Code</Text>
      <Text style={styles.otpSubtitle}>
        We've sent a 6-digit code to{'\n'}
        <Text style={{ fontWeight: '700' }}>{maskedPhone}</Text>
      </Text>
      {DEV_ANY_OTP && (
        <Text style={styles.otpSubtitle}>DEV MODE: enter any 6 digits (e.g. 000000).</Text>
      )}

      <View style={styles.otpInputRow}>
        {otp.map((digit: string, index: number) => (
          <AnimatedOtpBox
            key={index}
            digit={digit}
            index={index}
            inputRef={(el) => (otpInputs.current[index] = el)}
            onChangeText={(text: string) => onOtpChange(text, index)}
            onKeyPress={(e: any) => onOtpKeyPress(e, index)}
          />
        ))}
      </View>

      <AnimatedButton label={loading ? 'Verifying...' : 'Verify Code'} onPress={onVerify} style={styles.signInBtn} labelStyle={styles.signInLabel} disabled={loading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Didn't receive a code? </Text>
        <TouchableWithoutFeedback>
          <Text style={styles.footerLink}>Resend</Text>
        </TouchableWithoutFeedback>
      </View>

      <TouchableWithoutFeedback onPressIn={backPressIn} onPressOut={backPressOut} onPress={onBackToLogin}>
        <Text style={styles.magicText}>Back to Sign In</Text>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ─── Animated OTP Box ─────────────────────────────────────────────────────────

const AnimatedOtpBox = ({
  digit,
  index,
  inputRef,
  onChangeText,
  onKeyPress,
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: duration.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: duration.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.borderSoft, palette.brand],
  });

  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.surfaceSub, palette.surface],
  });

  return (
    <Animated.View
      style={[
        styles.otpInputBox,
        {
          borderColor,
          backgroundColor: bgColor,
          shadowOpacity: focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.15],
          }),
        },
      ]}
    >
      <TextInput
        ref={inputRef}
        style={styles.otpInputText}
        keyboardType="number-pad"
        maxLength={1}
        value={digit}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectTextOnFocus
      />
    </Animated.View>
  );
};

// ─── Reusable Animated Button ──────────────────────────────────────────────────

const AnimatedButton = ({
  label,
  onPress,
  style,
  labelStyle,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  style: any;
  labelStyle: any;
  disabled?: boolean;
}) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: pressScale.base, speed: duration.micro });
  const { opacity, translateY } = useFadeIn(0, { fromY: 8 });

  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} disabled={disabled}>
      <Animated.View style={[
        style,
        { opacity, transform: [{ translateY }] },
        disabled && { opacity: 0.6 },
      ]}>
        <Text style={[labelStyle, disabled && { color: 'rgba(255,255,255,0.8)' }]}>{label}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Social Button ─────────────────────────────────────────────────────────────

const SocialButton = ({ label }: { label: string }) => {
  const { pressIn, pressOut } = usePressFeedback({ scale: 0.97, speed: 100 });

  const isGoogle = label === 'Google';

  return (
    <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={styles.socialBtn}>
        {isGoogle ? (
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </Svg>
        ) : (
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1D1F">
            <Path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </Svg>
        )}
        <Text style={styles.socialLabel}>{label}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  mainContainer: {
    flex: 1,
  },

  // ── Hero / Decorative section ──
  heroSection: {
    width: '100%',
    flex: 0.35,
    minHeight: 180,
    backgroundColor: palette.surface,
    overflow: 'hidden',
    position: 'relative',
  },

  leftBar: {
    position: 'absolute',
    width: 14,
    height: 115,
    top: '35%',
    left: 0,
    backgroundColor: palette.brand,
    borderRadius: radius.sm,
  },

  brandArea: {
    position: 'absolute',
    bottom: 20,
    left: SW * 0.28,
  },

  brandLine1: {
    fontSize: 40,
    fontWeight: '300',
    color: palette.brand,
    letterSpacing: 1,
    lineHeight: 44,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  brandLine2: {
    fontSize: 40,
    fontWeight: '900',
    color: palette.brand,
    letterSpacing: -1,
  },

  brandTagline: {
    fontSize: 12,
    color: palette.brand,
    fontWeight: '400',
    lineHeight: 14,
    opacity: 0.85,
  },

  // ── Card (Login & OTP) ──
  cardContainer: {
    flex: 0.65,
    backgroundColor: palette.surface,
  },

  card: {
    flex: 1,
    backgroundColor: palette.surface,
    marginHorizontal: space.lg,
    marginTop: -10,
    borderRadius: radius.xl,
    padding: space.xl,
    justifyContent: 'space-between',
    ...elevation.raised,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.inkSub,
    marginBottom: space.xs,
    marginLeft: 4,
  },

  // ── Animated Input ──
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    height: 48,
    marginBottom: space.md,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    overflow: 'hidden',
    transitionProperty: 'border-color, background-color',
  },

  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: space.lg,
    fontSize: 15,
    color: palette.ink,
  },

  // ── Row: Remember / Forgot ──
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radius.xs,
    marginRight: space.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surface,
  },

  checkboxOn: {
    backgroundColor: palette.brand,
    borderColor: palette.brand,
  },

  checkLabel: {
    fontSize: 13,
    color: palette.inkSub,
  },

  forgotText: {
    fontSize: 13,
    color: palette.brand,
    fontWeight: '600',
  },

  // ── Buttons ──
  signInBtn: {
    backgroundColor: palette.brand,
    borderRadius: radius.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.brand,
  },

  signInLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  magicText: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '500',
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: space.lg,
  },

  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.borderSoft,
  },

  divText: {
    paddingHorizontal: space.md,
    color: palette.mutedSoft,
    fontSize: 12,
  },

  // ── Social ──
  socialRow: {
    flexDirection: 'row',
    gap: space.md,
    marginBottom: space.lg,
  },

  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: radius.md,
    height: 46,
    gap: space.sm,
    backgroundColor: palette.surfaceSub,
  },

  socialLabel: {
    fontSize: 14,
    color: palette.ink,
    fontWeight: '600',
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  footerText: {
    color: palette.muted,
    fontSize: 13,
  },

  footerLink: {
    color: palette.brand,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Dev Bypass ──
  devBypass: {
    marginTop: space.md,
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: space.sm,
    alignItems: 'center',
    backgroundColor: palette.surfaceSub,
  },

  devBypassText: {
    fontSize: 12,
    color: palette.mutedSoft,
    fontWeight: '500',
  },

  // ── OTP Specific ──
  otpContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  otpSubtitle: {
    fontSize: 13,
    color: palette.muted,
    textAlign: 'center',
    marginBottom: space.xl,
  },

  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: space.xl,
    paddingHorizontal: 4,
  },

  otpInputBox: {
    width: 42,
    height: 52,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSub,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },

  otpInputText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    textAlign: 'center',
    height: '100%',
    padding: 0,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    textAlign: 'center',
    marginBottom: space.md,
  },
});
