import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TextInput, Button, Card } from '@peptpal/ui';
import { submitFeedback, type FeedbackCategory } from '../../src/api/client';
import { getClientUuid } from '../../src/lib/clientId';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const APP_VERSION: string = (require('../../app.json') as { expo: { version: string } }).expo.version;

const CATEGORIES: { key: FeedbackCategory; label: string; hint: string }[] = [
  { key: 'bug', label: 'Bug', hint: "Something's broken or acting wrong" },
  { key: 'feature', label: 'Feature', hint: 'Suggest something new' },
  { key: 'general', label: 'General', hint: 'Feedback, questions, anything else' },
];

export default function FeedbackModal() {
  const router = useRouter();
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [body, setBody] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    setError('');
    const trimmed = body.trim();
    if (trimmed.length < 3) {
      setError('Please add a bit more detail.');
      return;
    }
    setSubmitting(true);
    try {
      const clientUuid = await getClientUuid().catch(() => undefined);
      await submitFeedback({
        category,
        body: trimmed,
        email: email.trim() || undefined,
        client_uuid: clientUuid,
        app_version: APP_VERSION,
        platform: Platform.OS,
      });
      setSent(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-white text-2xl font-bold mb-2">Thanks! 🙏</Text>
          <Text className="text-slate-300 text-base text-center leading-relaxed mb-8">
            Your feedback was received. We read every message and it genuinely shapes the app.
          </Text>
          <Button onPress={() => router.back()} size="lg">Close</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text className="text-slate-300 text-sm leading-relaxed">
            Found a bug, want a feature, or just have thoughts? Send it over — messages go straight
            to the team.
          </Text>

          <Card>
            <View className="gap-2">
              <Text className="text-slate-300 text-sm font-medium mb-1">Type</Text>
              <View className="flex-row gap-2">
                {CATEGORIES.map((c) => {
                  const active = category === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => setCategory(c.key)}
                      className={`flex-1 py-3 rounded-xl items-center border ${
                        active
                          ? 'bg-primary-600 border-primary-500'
                          : 'bg-surface-elevated border-surface-border'
                      }`}
                      activeOpacity={0.8}
                    >
                      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-300'}`}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text className="text-slate-500 text-xs mt-1">
                {CATEGORIES.find((c) => c.key === category)?.hint}
              </Text>
            </View>
          </Card>

          <TextInput
            label="Details"
            placeholder={
              category === 'bug'
                ? "What happened? What did you expect?"
                : category === 'feature'
                ? "What would you like PeptPal to do?"
                : "What's on your mind?"
            }
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={8}
            maxLength={4000}
            style={{ minHeight: 160, textAlignVertical: 'top' }}
            hint={`${body.length} / 4000`}
          />

          <TextInput
            label="Email (optional)"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            hint="Only if you want us to follow up."
          />

          {error ? (
            <View className="bg-danger-900/30 border border-danger-700/50 rounded-xl p-3">
              <Text className="text-danger-400 text-sm">{error}</Text>
            </View>
          ) : null}

          <View className="gap-2 mt-2">
            <Button onPress={onSubmit} disabled={submitting || body.trim().length < 3} size="lg">
              {submitting ? 'Sending…' : 'Send feedback'}
            </Button>
            <Button onPress={() => router.back()} variant="ghost">
              Cancel
            </Button>
          </View>

          <Text className="text-slate-500 text-xs text-center mt-2">
            {APP_VERSION} • {Platform.OS}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
