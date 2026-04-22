import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { logger } from '@/lib/logger';

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    logger.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.message}</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false, message: '' })}
          >
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#F0F4F8',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0F2340' },
  message: { fontSize: 14, color: '#4B6080', textAlign: 'center' },
  btn: {
    backgroundColor: '#1A3C6E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
