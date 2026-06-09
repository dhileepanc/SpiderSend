import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import CustomText from './CustomText';
import { fonts } from '../../theme';
import MailPopupIcon from '../../assets/icons/mailpopupicon.svg';
import TickIcon from '../../assets/icons/tickicon.svg';
import TrashPopupIcon from '../../assets/icons/trashpopupicon.svg';

type StatusType = 'success' | 'error';

interface StatusModalProps {
  visible: boolean;
  type: StatusType;
  title?: string;
  message: string;
  iconType?: 'mail' | 'tick' | 'trash' | 'danger';
  onClose: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({
  visible,
  type,
  title,
  message,
  iconType = 'tick',
  onClose,
}) => {
  const isSuccess = type === 'success';

  const defaultTitle = isSuccess ? 'Success' : 'Something went wrong';

  // Base on iconType to render the correct SVG
  const renderIcon = () => {
    // Custom SVGs for success flows based on user design
    if (iconType === 'mail') {
      return <MailPopupIcon width={76} height={90} style={styles.svgIcon} />;
    } else if (iconType === 'trash') {
      return <TrashPopupIcon width={80} height={80} style={styles.svgIcon} />;
    } else if (iconType === 'danger') {
      return (
        <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
          <CustomText style={[styles.iconText, { color: '#DC2626' }]}>!</CustomText>
        </View>
      );
    } else if (iconType === 'tick' && type !== 'error') {
      return <TickIcon width={87} height={85} style={styles.svgIcon} />;
    }

    if (type === 'error') {
      return (
        <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
          <CustomText style={[styles.iconText, { color: '#DC2626' }]}>✕</CustomText>
        </View>
      );
    }

    return <TickIcon width={87} height={85} style={styles.svgIcon} />;
  };

  const btnBg = isSuccess ? '#000' : '#DC2626';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close Icon for Error or optionally others if needed, but per design keeping it top right */}
          <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
            <CustomText style={styles.closeIconText}>✕</CustomText>
          </TouchableOpacity>

          {/* Icon */}
          {renderIcon()}

          {/* Title */}
          <CustomText style={[styles.title, { color: type === 'error' ? '#DC2626' : '#2DADBE' }]}>
            {title || defaultTitle}
          </CustomText>

          {/* Message */}
          <CustomText style={styles.message}>{message}</CustomText>

          {/* Continue Button */}
          {type === 'error' ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: btnBg }]}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <CustomText style={styles.buttonText}>Okay</CustomText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: btnBg }]}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <CustomText style={styles.buttonText}>Continue</CustomText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default StatusModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  svgIcon: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
    fontFamily: fonts.families.bold,
    lineHeight: 38,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.families.bold,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 13,
    fontFamily: fonts.families.medium,
    color: '#000',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  button: {
    width: 150,
    height: 48,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: fonts.families.bold,
    color: '#FFFFFF',
  },
  closeIconBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: fonts.families.bold,
  },
});
