import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Image, ScrollView, Text, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { receiptApi } from '../lib/receiptApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { ActionButton, Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'ReceiptScan'>;

export const ReceiptScanScreen = ({ navigation }: Props) => {
  const { token } = useAuth();
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [previewUri, setPreviewUri] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.base64) {
      setError('Could not read image data from selected file');
      return;
    }
    setError('');
    setImageUrl('');
    setPreviewUri(asset.uri);
    const mime = asset.mimeType ?? 'image/jpeg';
    setImageBase64(`data:${mime};base64,${asset.base64}`);
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.base64) {
      setError('Could not read captured image data');
      return;
    }
    setError('');
    setImageUrl('');
    setPreviewUri(asset.uri);
    const mime = asset.mimeType ?? 'image/jpeg';
    setImageBase64(`data:${mime};base64,${asset.base64}`);
  };

  const scan = async () => {
    if (!token) return;
    if (!imageBase64 && !imageUrl.trim()) {
      setError('Select an image or provide image URL');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const receipt = await receiptApi.scan(token, {
        ...(imageBase64 ? { imageBase64 } : {}),
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      });
      navigation.navigate('ReceiptConfirm', { receipt });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Receipt scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView>
        <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text.secondary }}>
          Upload from gallery/camera or paste a public image URL.
        </Text>
        {previewUri ? (
          <Image
            source={{ uri: previewUri }}
            style={{
              width: '100%',
              height: 240,
              borderRadius: theme.radius.md,
              marginTop: theme.spacing[3],
            }}
            resizeMode="cover"
          />
        ) : null}
        <ActionButton label="Choose from Gallery" onPress={pickFromGallery} />
        <ActionButton label="Capture with Camera" onPress={pickFromCamera} variant="secondary" />
        <TextInput
          value={imageUrl}
          onChangeText={(value) => {
            setImageUrl(value);
            if (value.trim()) setImageBase64('');
          }}
          placeholder="Or paste receipt image URL"
          placeholderTextColor={theme.colors.text.muted}
          autoCapitalize="none"
          style={{
            marginTop: theme.spacing[2],
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[2],
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.background.surface,
          }}
        />

        {loading ? <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing[2] }}>Running OCR...</Text> : null}
        {error ? <Text style={{ color: theme.colors.state.danger, marginTop: theme.spacing[2] }}>{error}</Text> : null}
        <ActionButton label="Scan Receipt" onPress={scan} />
      </ScrollView>
    </Screen>
  );
};
