/**
 * Fix 1 — New User Signup Screen
 * Appears after first OTP verification if advocate has no profile name.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors, ColorPalette, Typography, Spacing, Radius } from '../src/theme';
import { useApp } from '../src/context/AppContext';
import { CFTextInput } from '../src/components/common/CFTextInput';
import { CFButton } from '../src/components/common/CFButton';

const BAR_COUNCILS = [
  'Bar Council of Andhra Pradesh',
  'Bar Council of Assam, Nagaland, Meghalaya, Manipur, Tripura, Mizoram & Arunachal Pradesh',
  'Bar Council of Bihar',
  'Bar Council of Chhattisgarh',
  'Bar Council of Delhi',
  'Bar Council of Goa',
  'Bar Council of Gujarat',
  'Bar Council of Himachal Pradesh',
  'Bar Council of Jammu & Kashmir',
  'Bar Council of Jharkhand',
  'Bar Council of Karnataka',
  'Bar Council of Kerala',
  'Bar Council of Madhya Pradesh',
  'Bar Council of Maharashtra & Goa',
  'Bar Council of Odisha',
  'Bar Council of Punjab & Haryana',
  'Bar Council of Rajasthan',
  'Bar Council of Tamil Nadu',
  'Bar Council of Telangana',
  'Bar Council of Uttar Pradesh',
  'Bar Council of Uttarakhand',
  'Bar Council of West Bengal',
];

const PRACTICE_AREAS = [
  'Civil', 'Criminal', 'Family', 'Property', 'Corporate',
  'Labour', 'Tax', 'Consumer', 'Constitutional', 'IPR',
  'Cyber', 'Banking', 'Arbitration', 'Writ', 'Human Rights',
];

export default function SignupScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const { updateAdvocateProfile, advocateProfile } = useApp();

  const [name, setName] = useState(advocateProfile.name || '');
  const [barId, setBarId] = useState(advocateProfile.enrollmentNumber || '');
  const [barCouncil, setBarCouncil] = useState(advocateProfile.barCouncil || '');
  const [email, setEmail] = useState(advocateProfile.email || '');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(advocateProfile.practiceAreas || []);
  const [showCouncilPicker, setShowCouncilPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleArea = useCallback((area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  }, []);

  const handleSave = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!barId.trim()) newErrors.barId = 'Bar ID is required';
    if (!barCouncil.trim()) newErrors.barCouncil = 'Bar Council is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      updateAdvocateProfile({
        name: name.trim(),
        enrollmentNumber: barId.trim(),
        barCouncil: barCouncil.trim(),
        email: email.trim() || undefined,
        practiceAreas: selectedAreas.length > 0 ? selectedAreas : undefined,
      });
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [name, barId, barCouncil, email, selectedAreas, updateAdvocateProfile, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Welcome to LawFlow</Text>
          <Text style={styles.subtitle}>Set up your profile to get started</Text>

          {/* Full Name */}
          <CFTextInput
            testID="signup-name-input"
            label="Full Name *"
            value={name}
            onChangeText={(t) => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
            placeholder="Adv. Rajesh Kumar"
            error={errors.name}
          />

          {/* Bar ID */}
          <CFTextInput
            testID="signup-barid-input"
            label="Bar ID / Enrollment Number *"
            value={barId}
            onChangeText={(t) => { setBarId(t); setErrors(e => ({ ...e, barId: '' })); }}
            placeholder="MH/2018/12345"
            error={errors.barId}
          />

          {/* Bar Council */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Bar Council / State *</Text>
            <TouchableOpacity
              testID="signup-barcouncil-picker"
              style={[styles.pickerBtn, errors.barCouncil ? styles.pickerError : null]}
              onPress={() => setShowCouncilPicker(!showCouncilPicker)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerText, !barCouncil && styles.placeholderText]}>
                {barCouncil || 'Select Bar Council'}
              </Text>
            </TouchableOpacity>
            {errors.barCouncil ? <Text style={styles.errorText}>{errors.barCouncil}</Text> : null}
            {showCouncilPicker && (
              <View style={styles.councilList}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {BAR_COUNCILS.map(bc => (
                    <TouchableOpacity
                      key={bc}
                      style={[styles.councilItem, barCouncil === bc && styles.councilItemActive]}
                      onPress={() => {
                        setBarCouncil(bc);
                        setShowCouncilPicker(false);
                        setErrors(e => ({ ...e, barCouncil: '' }));
                      }}
                    >
                      <Text style={[styles.councilText, barCouncil === bc && styles.councilTextActive]}>
                        {bc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Email (optional) */}
          <CFTextInput
            testID="signup-email-input"
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="advocate@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Practice Areas (optional) */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Practice Areas (optional)</Text>
            <View style={styles.chipRow}>
              {PRACTICE_AREAS.map(area => {
                const sel = selectedAreas.includes(area);
                return (
                  <TouchableOpacity
                    key={area}
                    testID={`signup-area-${area.toLowerCase()}`}
                    style={[styles.chip, sel && styles.chipActive]}
                    onPress={() => toggleArea(area)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextActive]}>{area}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <CFButton
            testID="signup-save-btn"
            title="Save & Continue"
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.l, paddingBottom: 48 },
  title: { ...Typography.title1, color: c.textPrimary, marginBottom: 4 },
  subtitle: { ...Typography.subhead, color: c.textSecondary, marginBottom: Spacing.xl },
  fieldWrap: { marginBottom: Spacing.m },
  label: { ...Typography.footnote, fontWeight: '600', color: c.textSecondary, marginBottom: 6 },
  pickerBtn: {
    backgroundColor: c.surface,
    borderRadius: Radius.s,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: Spacing.s,
    paddingVertical: 12,
  },
  pickerError: { borderColor: '#FF3B30' },
  pickerText: { ...Typography.body, color: c.textPrimary },
  placeholderText: { color: c.textTertiary },
  errorText: { ...Typography.caption1, color: '#FF3B30', marginTop: 4 },
  councilList: {
    backgroundColor: c.surface,
    borderRadius: Radius.s,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  councilItem: { paddingHorizontal: Spacing.s, paddingVertical: 10 },
  councilItemActive: { backgroundColor: c.surfaceHighlight },
  councilText: { ...Typography.subhead, color: c.textPrimary },
  councilTextActive: { fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: c.border,
  },
  chipActive: { backgroundColor: c.textPrimary, borderColor: c.textPrimary },
  chipText: { ...Typography.caption1, color: c.textSecondary },
  chipTextActive: { color: c.background, fontWeight: '600' },
  saveBtn: { marginTop: Spacing.l },
});
