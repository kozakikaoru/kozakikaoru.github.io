// 端末の能力を判定して 3D を出すか静止画フォールバックにするかを決めるフック。
// - WebGL 非対応 → フォールバック
// - 明確な低スペック/省電力(コア数が極端に少ない等) → フォールバック
// - ユーザーが ?fallback=1 を付けた場合 → 強制フォールバック(デバッグ/客先確認用)
import { useEffect, useState } from 'react';

export interface DeviceCapability {
  /** 3D(WebGL)シーンを描画してよいか。 */
  canRender3D: boolean;
  /** 判定が済んだか(初回は false)。 */
  ready: boolean;
  /** フォールバックになった理由(デバッグ表示用)。 */
  reason: string | null;
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

function detect(): DeviceCapability {
  if (typeof window === 'undefined') {
    return { canRender3D: false, ready: true, reason: 'no-window' };
  }

  // URL で強制フォールバック(客先・デバッグ用の逃げ道)。
  const params = new URLSearchParams(window.location.search);
  if (params.get('fallback') === '1') {
    return { canRender3D: false, ready: true, reason: 'forced-by-url' };
  }

  if (!detectWebGL()) {
    return { canRender3D: false, ready: true, reason: 'no-webgl' };
  }

  // 極端な低スペックの目安: 論理コア数が 2 未満。
  // (端末や省電力設定によっては 3D が重くなるため静止画に倒す)
  const cores =
    typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : 4;
  if (cores > 0 && cores < 2) {
    return { canRender3D: false, ready: true, reason: 'low-cores' };
  }

  return { canRender3D: true, ready: true, reason: null };
}

export function useDeviceCapability(): DeviceCapability {
  const [cap, setCap] = useState<DeviceCapability>({
    canRender3D: false,
    ready: false,
    reason: null,
  });

  useEffect(() => {
    setCap(detect());
  }, []);

  return cap;
}
