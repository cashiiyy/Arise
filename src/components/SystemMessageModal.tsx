import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { SystemText } from './SystemText';
import { COLORS, SYSTEM_GLOW } from '../theme';

interface SystemMessageModalProps {
  visible: boolean;
  message: string;
  onClose: () => void;
  title?: string;
}

export const SystemMessageModal: React.FC<SystemMessageModalProps> = ({ 
  visible, 
  message, 
  onClose,
  title = "SYSTEM MESSAGE"
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <SystemText variant="h2" color={COLORS.primary} align="center" style={{ marginBottom: 16 }}>
            {title}
          </SystemText>
          <SystemText variant="body" align="center" style={{ marginBottom: 24, lineHeight: 24 }}>
            {message}
          </SystemText>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <SystemText variant="h2" color={COLORS.background}>ACKNOWLEDGE</SystemText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 24,
    width: '100%',
    ...SYSTEM_GLOW,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  }
});
