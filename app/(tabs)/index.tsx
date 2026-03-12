import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

const COLORS = {
  background: '#F0F4F8',
  primary: '#2F4F9F',       // jasny granatowy
  primaryDark: '#243B7A',
  primaryLight: '#DBEAFE',
  accent: '#E8F5E9',
  accentGreen: '#2E7D32',
  accentPurple: '#4A148C',
  accentPurpleLight: '#F3E5F5',
  accentBlueLight: '#DBEAFE',
  accentOrangeLight: '#FFF4E5',
  white: '#FFFFFF',
  textPrimary: '#1A2B3C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  border: '#D9E2EC',
  shadow: '#A0AEC0',
};

export default function DashboardScreen() {
  const handleTriagePress = () => {
    router.push('/triage' as never);
  };

  const handleQuickAction = (label: string) => {
    Alert.alert(label, 'Ta funkcja będzie dostępna wkrótce.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.headerContainer}>
          {/* Lewa strona – logo kliniki */}
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/images/KlinikaRogLogo.png')}
              style={styles.logoImage}
            />
          </View>

          {/* Prawa strona – zalogowany pacjent */}
          <View style={styles.headerRight}>
            <Text style={styles.headerRightLabel}>Zalogowany jako</Text>
            <Text style={styles.headerRightName}>Jan Kowalski</Text>
            <Ionicons
              name="person-circle-outline"
              size={20}
              color="#9CA3AF"
              style={styles.headerRightIcon}
            />
          </View>
        </View>

        {/* ── HERO ACTIONS: PRIMARY & SECONDARY CTA ── */}
        <View style={styles.heroSection}>
          {/* Primary CTA */}
          <Pressable
            style={({ pressed }) => [styles.heroPrimaryCard, pressed && styles.heroPrimaryPressed]}
            onPress={handleTriagePress}
            accessibilityLabel="Zgłoś problem – przejdź do szybkiej ankiety"
            accessibilityRole="button">
            <View style={styles.heroIconWrapperPrimary}>
              <Ionicons name="medkit-outline" size={32} color={COLORS.white} />
            </View>
            <View style={styles.heroTextGroup}>
              <Text style={styles.heroTitlePrimary}>Zgłoś problem</Text>
              <Text style={styles.heroSubtitlePrimary}>Błyskawiczna ankieta</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={26}
              color="rgba(255,255,255,0.85)"
              style={styles.heroChevron}
            />
          </Pressable>

          {/* Secondary CTA */}
          <Pressable
            style={({ pressed }) => [styles.heroSecondaryCard, pressed && styles.heroSecondaryPressed]}
            onPress={() => router.push('/booking' as never)}
            accessibilityLabel="Umów wizytę – wybierz termin z kalendarza"
            accessibilityRole="button">
            <View style={styles.heroIconWrapperSecondary}>
              <Ionicons name="calendar-outline" size={30} color={COLORS.primary} />
              <View style={styles.heroIconBadge}>
                <Ionicons name="add" size={14} color={COLORS.primary} />
              </View>
            </View>
            <View style={styles.heroTextGroup}>
              <Text style={styles.heroTitleSecondary}>Umów wizytę</Text>
              <Text style={styles.heroSubtitleSecondary}>Wybierz termin z kalendarza</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={COLORS.primary}
              style={styles.heroChevron}
            />
          </Pressable>
        </View>

        {/* ── SECTION LABEL ── */}
        <Text style={styles.sectionLabel}>Na skróty</Text>

        {/* ── QUICK ACTIONS GRID ── */}
        <View style={styles.quickGrid}>
          {/* 1. Zadzwoń */}
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardOrange]}
            onPress={() => handleQuickAction('Zadzwoń do przychodni')}
            accessibilityLabel="Zadzwoń do przychodni"
            accessibilityRole="button"
            activeOpacity={0.8}>
            <View style={styles.quickIconWrapper}>
              <Ionicons name="call" size={30} color="#2563EB" />
            </View>
            <Text style={styles.quickCardTitle}>
              Zadzwoń
            </Text>
          </TouchableOpacity>

          {/* 2. Moje e-Recepty */}
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardGreen]}
            onPress={() => handleQuickAction('Moje e-Recepty')}
            accessibilityLabel="Moje e-Recepty"
            accessibilityRole="button"
            activeOpacity={0.8}>
            <View style={styles.quickIconWrapper}>
              <Ionicons name="document-text-outline" size={28} color="#2563EB" />
            </View>
            <Text style={styles.quickCardTitle}>
              Moje e-Recepty
            </Text>
          </TouchableOpacity>

          {/* 3. Moje wizyty */}
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardBlue]}
            onPress={() => handleQuickAction('Moje wizyty')}
            accessibilityLabel="Moje wizyty"
            accessibilityRole="button"
            activeOpacity={0.8}>
            <View style={styles.quickIconWrapper}>
              <Ionicons name="calendar-outline" size={28} color="#2563EB" />
            </View>
            <Text style={styles.quickCardTitle}>
              Moje wizyty
            </Text>
          </TouchableOpacity>

          {/* 4. Historia leczenia */}
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardPurple]}
            onPress={() => handleQuickAction('Historia leczenia')}
            accessibilityLabel="Historia leczenia"
            accessibilityRole="button"
            activeOpacity={0.8}>
            <View style={styles.quickIconWrapper}>
              <Ionicons name="time-outline" size={28} color="#2563EB" />
            </View>
            <Text style={styles.quickCardTitle}>
              Historia leczenia
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── SECONDARY ACTIONS ── */}
        <Text style={styles.sectionLabel}>Więcej opcji</Text>

        <View style={styles.listCard}>
          {[
            { icon: 'document-text-outline' as const, label: 'Wyniki badań (PDF)', color: '#D84315' },
            { icon: 'pulse-outline' as const, label: 'E-Zwolnienia (L4)', color: '#00695C' },
            { icon: 'videocam-outline' as const, label: 'Konsultacje Online', color: COLORS.primary },
            { icon: 'card-outline' as const, label: 'Moje płatności', color: '#92400E' },
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.listItem,
                index < arr.length - 1 && styles.listItemBorder,
              ]}
              onPress={() => handleQuickAction(item.label)}
              accessibilityLabel={item.label}
              accessibilityRole="button"
              activeOpacity={0.7}>
              <View style={[styles.listIconWrapper, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.listItemLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const SHADOW = Platform.select({
  ios: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  android: { elevation: 6 },
  default: {},
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ── Header ──
  headerContainer: {
    backgroundColor: COLORS.white,
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: -20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  clinicTextGroup: {
    justifyContent: 'center',
  },
  clinicName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  clinicSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logoImage: {
    width: 160,
    height: 45,
    resizeMode: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerRightLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  headerRightName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  headerRightIcon: {
    marginTop: 2,
  },

  // ── Hero Section ──
  heroSection: {
    marginBottom: 28,
  },
  heroPrimaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 96,
    ...SHADOW,
  },
  heroPrimaryPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  heroSecondaryCard: {
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 92,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...SHADOW,
  },
  heroSecondaryPressed: {
    backgroundColor: '#EFF6FF',
  },
  heroIconWrapperPrimary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroIconWrapperSecondary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroIconBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  heroTextGroup: {
    flex: 1,
  },
  heroTitlePrimary: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  heroSubtitlePrimary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  heroTitleSecondary: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  heroSubtitleSecondary: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  heroChevron: {
    marginLeft: 8,
  },

  // ── Section Label ──
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },

  // ── Quick Grid ──
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  quickCard: {
    width: '48%',
    borderRadius: 18,
    padding: 16,
    minHeight: 120,
    marginBottom: 16,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  quickCardGreen: {
    backgroundColor: COLORS.white,
  },
  quickCardPurple: {
    backgroundColor: COLORS.white,
  },
  quickCardBlue: {
    backgroundColor: COLORS.white,
  },
  quickCardOrange: {
    backgroundColor: COLORS.white,
  },
  quickIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: COLORS.primaryLight,
  },
  quickCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
    textAlign: 'center',
  },

  // ── List Card ──
  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOW,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 64,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  listItemLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },

  bottomSpacer: {
    height: 32,
  },
});
