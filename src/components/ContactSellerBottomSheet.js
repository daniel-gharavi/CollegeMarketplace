import React, { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ContactSellerBottomSheet = ({ visible, onClose, seller }) => {
  const bottomSheetRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Variables
  const snapPoints = useMemo(() => ['1%', '60%'], []);

  // Callbacks
  const handleSheetChanges = useCallback((index) => {
    console.log('Bottom sheet index changed to:', index);
    if (index === 0 || index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={1}
        opacity={0.5}
        onPress={onClose}
      />
    ),
    [onClose]
  );

  // Effects
  React.useEffect(() => {
    console.log('ContactSellerBottomSheet visible changed:', visible);
    console.log('Seller data:', seller);
    if (visible) {
      console.log('Attempting to snap to index 1...');
      bottomSheetRef.current?.snapToIndex(1);
    } else {
      console.log('Closing bottom sheet...');
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleEmailPress = async () => {
    if (!seller?.email) {
      Alert.alert('Error', 'No email available for this seller');
      return;
    }

    const emailUrl = `mailto:${seller.email}?subject=Interest in your item&body=Hi ${seller.first_name}, I'm interested in your item posted on College Marketplace.`;
    
    try {
      await Linking.openURL(emailUrl);
      onClose();
    } catch (err) {
      console.error('Error opening email:', err);
      Alert.alert('Error', 'Failed to open email app');
    }
  };

  const handleCallPress = async () => {
    if (!seller?.phone_number) {
      Alert.alert('Error', 'No phone number available for this seller');
      return;
    }

    const cleanPhoneNumber = seller.phone_number.replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${cleanPhoneNumber}`;
    
    try {
      await Linking.openURL(phoneUrl);
      onClose();
    } catch (err) {
      console.error('Error opening phone:', err);
      Alert.alert('Error', 'Failed to open phone app');
    }
  };

  console.log('Rendering ContactSellerBottomSheet with visible:', visible);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 1 : 0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.dragHandle}
    >
      <BottomSheetView style={[styles.contentContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Contact Seller</Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
            style={styles.closeButton}
          />
        </View>
        
        <Text style={styles.sellerName}>
          {seller?.first_name} {seller?.last_name}
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleEmailPress}
            style={styles.button}
            labelStyle={[styles.buttonText, { flexShrink: 0 }]}
            contentStyle={styles.buttonContent}
            icon="email"
            disabled={!seller?.email}
            compact={false}
          >
            Email
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleCallPress}
            style={styles.button}
            labelStyle={[styles.buttonText, { flexShrink: 0 }]}
            contentStyle={styles.buttonContent}
            icon="phone"
            disabled={!seller?.phone_number}
            compact={false}
          >
            Call
          </Button>
        </View>

        <View style={styles.contactInfoContainer}>
          {seller?.email && (
            <Text style={styles.contactInfo}>📧 {seller.email}</Text>
          )}
          {seller?.phone_number && (
            <Text style={styles.contactInfo}>📞 {seller.phone_number}</Text>
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dragHandle: {
    backgroundColor: '#ccc',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    minWidth: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  sellerName: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 4,
  },
  contactInfoContainer: {
    // Container for contact info
  },
  contactInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ContactSellerBottomSheet; 