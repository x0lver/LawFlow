/**
 * Phase 19 — Video Launch Screen
 * Plays intro.mp4 fullscreen on cold launch, then navigates to login.
 * Skip button visible immediately. Auto-navigates after 5 seconds.
 *
 * Web:    HTML <video> tag (autoPlay muted playsInline)
 * Native: expo-av Video component (Expo Go compatible)
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const videoUrl = `${BACKEND_URL}/api/static/intro.mp4`;
const localAsset = require('../assets/videos/intro.mp4');

let _navigated = false;

export default function IntroScreen() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateAway = () => {
    if (_navigated) return;
    _navigated = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    router.replace('/');
  };

  useEffect(() => {
    _navigated = false;
    timerRef.current = setTimeout(navigateAway, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <video
          src={videoUrl}
          autoPlay
          muted
          playsInline
          onEnded={navigateAway}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
          }}
        />
      ) : (
        <Video
          source={localAsset}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isMuted
          isLooping={false}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && status.didJustFinish) {
              navigateAway();
            }
          }}
        />
      )}

      <TouchableOpacity
        testID="intro-skip-btn"
        style={styles.skipBtn}
        onPress={navigateAway}
        activeOpacity={0.6}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
