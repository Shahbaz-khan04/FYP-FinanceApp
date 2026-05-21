import { Ionicons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { receiptApi } from '../lib/receiptApi';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Screen } from './common';

type Props = NativeStackScreenProps<RootStackParamList, 'ReceiptScan'>;

export const ReceiptScanScreen = ({ navigation }: Props) => {
  const { token } = useAuth();
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [previewUri, setPreviewUri] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: true });
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
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={16} color="#c6d5df" />
          </Pressable>
          <Text style={styles.headerTitle}>MoneyLens</Text>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.iconBtn}>
            <Ionicons name="person-circle-outline" size={16} color="#c6d5df" />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Scan Receipt</Text>
        <Text style={styles.helper}>Upload a receipt image from gallery/camera or URL.</Text>

        <View style={styles.previewWrap}>
          {previewUri ? <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" /> : <Ionicons name="receipt-outline" size={44} color="#4f606f" />}
        </View>

        <View style={styles.row}>
          <Pressable style={styles.slimBtn} onPress={pickFromGallery}>
            <Ionicons name="images-outline" size={14} color="#17dff8" />
            <Text style={styles.slimBtnText}>Gallery</Text>
          </Pressable>
          <Pressable style={styles.slimBtn} onPress={pickFromCamera}>
            <Ionicons name="camera-outline" size={14} color="#17dff8" />
            <Text style={styles.slimBtnText}>Camera</Text>
          </Pressable>
        </View>

        <TextInput
          value={imageUrl}
          onChangeText={(value) => {
            setImageUrl(value);
            if (value.trim()) setImageBase64('');
          }}
          placeholder="Or paste receipt image URL"
          placeholderTextColor="#748692"
          autoCapitalize="none"
          style={styles.input}
        />

        {loading ? <Text style={styles.helper}>Running OCR...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primaryBtn} onPress={scan} disabled={loading}>
          <Ionicons name="scan-outline" size={14} color="#063742" />
          <Text style={styles.primaryBtnText}>{loading ? 'Scanning...' : 'Scan Receipt'}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(154,170,184,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(12, 19, 33, 0.78)',
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#15def8', fontSize: 20, fontWeight: '800' },
  sectionTitle: { color: '#dbe3ea', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  helper: { color: '#8a99a5', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  previewWrap: {
    borderWidth: 1,
    borderColor: 'rgba(154,170,184,0.24)',
    borderRadius: 12,
    backgroundColor: 'rgba(17,25,39,0.82)',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  previewImage: { width: '100%', height: 220 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  slimBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(154,170,184,0.22)',
    backgroundColor: 'rgba(17,25,39,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  slimBtnText: { color: '#c6d5df', fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(154,170,184,0.2)',
    backgroundColor: 'rgba(17,25,39,0.82)',
    color: '#d5dfe7',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 0,
    marginBottom: 8,
  },
  primaryBtn: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#1bdcf7',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryBtnText: { color: '#063742', fontSize: 18, fontWeight: '800' },
  error: { color: '#ff8089', fontSize: 14, fontWeight: '600', marginBottom: 8 },
});
