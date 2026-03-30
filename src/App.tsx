/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

// 定义所有支持的数位
const ALL_PLACES = [
  { name: '万位', val: 10000, color: '#87ceeb' },
  { name: '千位', val: 1000, color: '#ffb6c1' },
  { name: '百位', val: 100, color: '#fffacd' },
  { name: '十位', val: 10, color: '#87ceeb' },
  { name: '个位', val: 1, color: '#ffb6c1' },
  { name: '十分位', val: 0.1, color: '#fffacd' },
  { name: '百分位', val: 0.01, color: '#87ceeb' },
];

// 中国习惯的数字格式化（每4位加逗号）
function formatChineseNumber(num: number) {
  // 处理浮点数精度问题，最多保留两位小数
  const str = Number(Math.round(num * 100) / 100).toString();
  const parts = str.split('.');
  // 整数部分每4位加逗号
  parts[0] = parts[0].replace(/\B(?=(\d{4})+(?!\d))/g, ',');
  return parts.join('.');
}

const Bead: React.FC<{ color: string, index: number }> = ({ color, index }) => {
  // 容器高度 340px，内容高度 332px。算珠高度 24px (h-6)。
  // 目标位置在底部堆叠
  const targetTop = 332 - (index + 1) * 24;

  return (
    <div 
      className="absolute left-1/2 w-12 md:w-16 h-6 -ml-6 md:-ml-8 rounded-full border-2 border-black/10 shadow-sm animate-bead-drop"
      style={{
        backgroundColor: color,
        top: `${targetTop}px`,
        zIndex: 10 - index
      }}
    >
      {/* 算珠的高光效果 */}
      <div className="absolute top-1 left-2 right-2 h-2 bg-white/40 rounded-full"></div>
    </div>
  );
};

export default function App() {
  const [config, setConfig] = useState<{ maxIdx: number, minIdx: number } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 初始化音频上下文
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // 播放音效
  const playSound = (type: 'click' | 'carry' | 'reset') => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'carry') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'reset') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.error('Audio playback failed:', e);
    }
  };

  // 渲染设置界面
  if (!config) {
    return <SetupScreen onStart={(cfg) => { initAudio(); setConfig(cfg); }} />;
  }

  return (
    <>
      <style>{`
        @keyframes beadDrop {
          0% { transform: translateY(-340px); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(0); }
        }
        .animate-bead-drop {
          animation: beadDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      <CounterScreen 
        config={config} 
        onBack={() => setConfig(null)} 
        playSound={playSound} 
      />
    </>
  );
}

// --- 设置界面组件 ---
function SetupScreen({ onStart }: { onStart: (cfg: { maxIdx: number, minIdx: number }) => void }) {
  const [maxIdx, setMaxIdx] = useState(0); // 默认万位
  const [minIdx, setMinIdx] = useState(4); // 默认个位

  const handleStart = () => {
    onStart({ maxIdx, minIdx });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border-4 border-pink-100 max-w-md w-full text-center">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-8 tracking-wider">
          ✨ 计数器设置 ✨
        </h1>
        
        <div className="flex flex-col gap-6 mb-10">
          <label className="flex flex-col text-left font-bold text-gray-600 text-lg">
            选择最高数位：
            <select 
              value={maxIdx} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxIdx(val);
                if (val > minIdx) setMinIdx(val);
              }}
              className="mt-2 p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-xl focus:border-pink-300 outline-none"
            >
              {ALL_PLACES.map((p, i) => (
                <option key={`max-${i}`} value={i} disabled={i > minIdx}>{p.name}</option>
              ))}
            </select>
          </label>
          
          <label className="flex flex-col text-left font-bold text-gray-600 text-lg">
            选择最低数位：
            <select 
              value={minIdx} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinIdx(val);
                if (val < maxIdx) setMaxIdx(val);
              }}
              className="mt-2 p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-xl focus:border-pink-300 outline-none"
            >
              {ALL_PLACES.map((p, i) => (
                <option key={`min-${i}`} value={i} disabled={i < maxIdx}>{p.name}</option>
              ))}
            </select>
          </label>
        </div>

        <button 
          onClick={handleStart}
          className="w-full py-4 bg-[#87ceeb] hover:bg-[#75bfe0] text-white text-2xl font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
        >
          进入计数器 🚀
        </button>
      </div>
    </div>
  );
}

// --- 计数器主界面组件 ---
function CounterScreen({ 
  config, 
  onBack, 
  playSound 
}: { 
  config: { maxIdx: number, minIdx: number }, 
  onBack: () => void,
  playSound: (type: 'click' | 'carry' | 'reset') => void 
}) {
  const places = ALL_PLACES.slice(config.maxIdx, config.minIdx + 1);
  const [counts, setCounts] = useState<number[]>(places.map(() => 0));

  // 监听满十进一逻辑
  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = [];
    counts.forEach((count, i) => {
      if (count >= 10) {
        // 延迟 500ms，让小朋友能看清 10 颗珠子落下的状态
        const tid = setTimeout(() => {
          setCounts(prev => {
            const next = [...prev];
            if (next[i] >= 10) {
              next[i] -= 10; // 当前位清零
              if (i > 0) {
                next[i - 1] += 1; // 上一位进一
              }
            }
            return next;
          });
          playSound('carry');
        }, 500);
        timeoutIds.push(tid);
      }
    });
    return () => timeoutIds.forEach(clearTimeout);
  }, [counts, playSound]);

  // 处理点击列添加算珠
  const handleColumnClick = (colIndex: number) => {
    if (counts[colIndex] >= 10) return; // 进位动画期间禁止点击
    
    setCounts(prev => {
      const next = [...prev];
      next[colIndex] += 1;
      return next;
    });
    playSound('click');
  };

  const handleReset = () => {
    setCounts(places.map(() => 0));
    playSound('reset');
  };

  // 计算总数值
  const totalValue = counts.reduce((sum, count, i) => sum + count * places[i].val, 0);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center py-6 md:py-10 font-sans selection:bg-pink-200">
      
      {/* 顶部导航 */}
      <div className="w-full max-w-5xl px-4 flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-white text-gray-500 font-bold rounded-full shadow hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          重新设置
        </button>
        <h1 className="text-2xl md:text-4xl font-black text-gray-800 tracking-wider hidden md:block">
          ✨ 双十湖里数学课堂 ✨
        </h1>
        <div className="w-[100px]"></div> {/* 占位以居中标题 */}
      </div>

      <p className="text-gray-500 mb-6 text-sm md:text-lg text-center max-w-md px-4">
        点击下方的数位柱，就会掉下一颗珠子。凑满 <span className="text-pink-500 font-bold">10</span> 颗会自动进位哦！
      </p>

      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border-4 border-gray-100 flex flex-col items-center w-full max-w-5xl overflow-x-auto">
        
        {/* 总数值显示区 */}
        <div className="mb-10 bg-gray-50 px-6 md:px-10 py-4 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col md:flex-row items-center gap-2 md:gap-4">
          <span className="text-lg md:text-2xl text-gray-500 font-bold">当前数值：</span>
          <span className="text-3xl md:text-5xl font-black text-[#ffb6c1] tracking-widest drop-shadow-sm">
            {formatChineseNumber(totalValue)}
          </span>
        </div>

        {/* 算盘主体 */}
        <div className="flex gap-2 md:gap-6 justify-center min-w-max px-4 items-end">
          {places.map((place, colIndex) => (
            <React.Fragment key={place.name}>
              {/* 如果当前是十分位，在它前面渲染一个小数点 */}
              {place.name === '十分位' && (
                <div className="flex items-end pb-24 font-black text-4xl md:text-6xl text-gray-400">
                  .
                </div>
              )}
              
              {/* 单个数位列 */}
              <div 
                onClick={() => handleColumnClick(colIndex)}
                className="flex flex-col items-center cursor-pointer group"
              >
                {/* 柱子区域 */}
                <div className="relative w-14 md:w-20 h-[340px] bg-[#fdfdfd] rounded-t-full border-4 border-gray-200 shadow-inner flex justify-center overflow-hidden group-hover:border-pink-200 group-hover:bg-pink-50/30 transition-colors">
                  {/* 中间的木杆 */}
                  <div className="absolute top-2 bottom-0 w-2 md:w-3 bg-gray-300 rounded-t-full shadow-inner"></div>
                  
                  {/* 动态渲染算珠 */}
                  {Array.from({ length: counts[colIndex] }).map((_, beadIndex) => (
                    <Bead 
                      key={beadIndex}
                      index={beadIndex}
                      color={place.color}
                    />
                  ))}
                </div>
                
                {/* 数位名称 */}
                <div className="mt-4 text-sm md:text-lg font-bold text-gray-600 bg-white px-2 md:px-4 py-2 rounded-full shadow-sm border-2 border-gray-100 group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors whitespace-nowrap">
                  {place.name}
                </div>
                
                {/* 当前列的数字 */}
                <div className="mt-2 text-xl md:text-3xl font-black text-gray-700 group-hover:text-pink-500 transition-colors">
                  {counts[colIndex]}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

      </div>

      {/* 归零按钮 */}
      <button 
        onClick={handleReset}
        className="mt-8 px-8 py-4 bg-[#87ceeb] hover:bg-[#75bfe0] text-white text-xl md:text-2xl font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200 flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        一键归零
      </button>
    </div>
  );
}
