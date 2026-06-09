import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import CustomText from './CustomText';
import { fonts } from '../../theme';
import TrashPopupIcon from '../../assets/icons/trashpopupicon.svg';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  loading = false,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close Icon */}
          <TouchableOpacity style={styles.closeIconBtn} onPress={onCancel} disabled={loading}>
             <CustomText style={styles.closeIconText}>✕</CustomText>
          </TouchableOpacity>
          
          {/* Icon */}
          <TrashPopupIcon width={80} height={80} style={styles.svgIcon} />

          {/* Title */}
          <CustomText style={styles.title}>{title}</CustomText>

          {/* Message */}
          <CustomText style={styles.message}>{message}</CustomText>

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.btn, styles.cancelBtn]} 
              onPress={onCancel} 
              disabled={loading}
              activeOpacity={0.8}
            >
              <CustomText style={styles.cancelBtnText}>{cancelText}</CustomText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btn, styles.confirmBtn]} 
              onPress={onConfirm} 
              disabled={loading}
              activeOpacity={0.8}
            >
              <CustomText style={styles.confirmBtnText}>{confirmText}</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;

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
  closeIconBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 34,
    height: 34,
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
  svgIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#FF0707',
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
  footer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF0404',
  },
  confirmBtn: {
    backgroundColor: '#FF0404',
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#000',
  },
  confirmBtnText: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#FFFFFF',
  },
});
