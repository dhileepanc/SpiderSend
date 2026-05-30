import React, {useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
  Keyboard,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';


import LoginImage from '../assets/images/image.svg';
import ArrowLeftIcon from '../assets/icons/arrowleft.svg';

import {fonts} from '../theme/fonts';
import {CustomButton, CustomInput, CustomText} from '../components/common';
import {useAuth, useTheme} from '../hooks';
import {validateEmail} from '../utils';

const {width, height} = Dimensions.get('screen');

const LoginScreen = () => {
  const {spacing} = useTheme();
  const {requestOtp, verifyOtp, loading, error, clearAuthError} = useAuth();

  const [email, setEmail] = useState('');
const [otp,setOtp]=useState(["","","","","",""]);
  const [emailError, setEmailError] = useState('');

  // LOGIN -> OTP VERIFY SCREEN
  const [showVerify, setShowVerify] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

   const OTP_LENGTH = 6;


  const handleGetCode = async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    const ok = await requestOtp(email);
    if (ok) {
      setShowVerify(true);
    }
  };
 const handleChange = (text: string, index: number) => {

    // Allow only numbers
    if (!/^\d*$/.test(text)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;

    setOtp(newOtp);

    // Move to next box automatically
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all boxes filled — auto-submit
    const joinedOtp = newOtp.join('');
    if (joinedOtp.length === OTP_LENGTH) {
      Keyboard.dismiss();
      handleVerify(joinedOtp);
    }
  };

    const handleKeyPress = (
    e: any,
    index: number
  ) => {

    if (
      e.nativeEvent.key === 'Backspace' &&
      otp[index] === '' &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleVerify = async (otpOverride?: string) => {
    const otpValue = otpOverride ?? otp.join('');
    if (otpValue.length < OTP_LENGTH) {
      return;
    }
    await verifyOtp(email, otpValue);
    // Navigation is handled automatically by RootNavigator
    // watching isAuthenticated from Redux
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* FULLSCREEN BACKGROUND IMAGE */}
      <LoginImage
        width={width}
        height={height}
        style={styles.image}
      />
     {/* BACK BUTTON */}
        {showVerify && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowVerify(false)}>
            <ArrowLeftIcon
  width={34}
  height={34}
/>
          </TouchableOpacity>
        )}
      {/* CENTER CONTENT */}
      <View style={styles.centerContent}>
        <Text style={styles.title}>
          Welcome to{' '}
          <Text style={styles.highlight}>SpiderSend</Text>
        </Text>

        <Text style={styles.subtitle}>
          Scan business cards, manage contacts,{'\n'}
          and send smart campaigns — all in one CRM.
        </Text>
      </View>
{/* BOTTOM CARD */}
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
  keyboardVerticalOffset={20}
  style={styles.keyboardView}>
      <View style={styles.bottomCard}>

   

        {/* TITLE */}
        <Text style={styles.loginTitle}>
          {showVerify ? 'Verify your email' : 'Login'}
        </Text>

        {/* SUBTITLE */}
        <Text style={styles.loginSubtitle}>
          {showVerify
            ? `We’ve sent a 6-digit verification code to\n${email}`
            : 'Use mail id to login'}
        </Text>

        <View style={{marginTop: spacing.xl}}>

          {/* LABEL */}
          <CustomText style={styles.emailLabel}>
            {showVerify ? 'OTP Code' : 'Email'}
          </CustomText>

          {/* INPUT */}
        {showVerify ? (
  <View style={styles.otpContainer}>
    {otp.map((digit, index) => (
      <TextInput
        key={index}
        ref={ref => {
          inputRefs.current[index] = ref;
        }}
        value={digit}
        onChangeText={text => handleChange(text, index)}
        onKeyPress={e => handleKeyPress(e, index)}
        style={styles.otpInput}
        keyboardType="number-pad"
        maxLength={1}
      />
    ))}
  </View>
) : (
  <CustomInput
    placeholder="Enter mail id"
    value={email}
    onChangeText={text => {
      setEmail(text);
      if (emailError) setEmailError('');
      if (error) clearAuthError();
    }}
    error={emailError}
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}
    inputRowStyle={styles.inputRow}
    inputStyle={styles.inputText}
  />
)}

          {/* API error banner */}
          {!!error && (
            <CustomText style={styles.errorBanner}>{error}</CustomText>
          )}

          {!showVerify && !emailError && !error ? (
            <CustomText style={styles.hint}>
              Secure one-time code will be sent to your email
            </CustomText>
          ) : showVerify ? (
          <CustomText style={styles.hint}>
  Didn't get it?{' '}
  <CustomText
    style={styles.resendText}
    onPress={() => requestOtp(email)}>
    Resend Code
  </CustomText>
</CustomText>
          ) : null}
        </View>

        {/* BUTTON */}
        <CustomButton
          title={showVerify ? 'Verify Code' : 'Get Code'}
          onPress={showVerify ? () => handleVerify() : handleGetCode}
          loading={loading}
          style={styles.button}
          textStyle={styles.buttonText}
        />

      </View>
       </KeyboardAvoidingView>
    </View>
   
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  image: {
    position: 'absolute',
    top: -70,
    left: 0,
  },

  centerContent: {
    position: 'absolute',
    bottom: height * 0.42 + 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: fonts.families.extrabold,
  },

  highlight: {
    color: '#23A9BB',
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontFamily: fonts.families.medium,
    marginTop: 6,
  },

bottomCard: {
  minHeight: height * 0.42,

  backgroundColor: '#FFFFFF',

  borderRadius: 34,

  paddingTop: 24,
  paddingHorizontal: 28,
  paddingBottom: 20,
},

  backButton: {
    position: 'absolute',
    top: 66,
    left: 30,
    zIndex: 10,
  
  },

  loginTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: fonts.families.extrabold,
  },

  loginSubtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#9A9A9A',
    fontFamily: fonts.families.medium,
  },

  emailLabel: {
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 10,
    fontFamily: fonts.families.bold,
  },

  inputRow: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
  },

  inputText: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: fonts.families.medium,
  },

  hint: {
    color: '#9A9A9A',
    fontSize: 12,
    marginTop: 8,
    fontFamily: fonts.families.medium,

  textAlign: 'center',
  },

  button: {
    marginTop: 36,
    height: 56,
    borderRadius: 30,
    backgroundColor: '#000000',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.families.bold,
  },
otpContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 4,
},

 otpInput: {
  width: 44,
  height: 50  ,

  backgroundColor: '#F5F7FB',

  borderWidth: 1,
  borderColor: '#E2E8F0',

  borderRadius: 14,

  fontSize: 22,
  color: '#0F172A',

  textAlign: 'center',

  fontFamily: fonts.families.bold,
},
resendText: {
  color: '#23A9BB',
  fontFamily: fonts.families.bold,
},
errorBanner: {
  color: '#E53E3E',
  fontSize: 12,
  marginTop: 8,
  textAlign: 'center',
  fontFamily: fonts.families.medium,
},
keyboardView: {
  position: 'absolute',
  left: 20,
  right: 20,
  bottom: 20,
},
});