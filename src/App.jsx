import { useState, useEffect } from 'react';
import { 
  Settings, Code, Triangle, Box, RefreshCw, 
  ExternalLink, Power, Play, Layers, LayoutDashboard
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchGithubRepos, fetchVercelDeployments, fetchHfSpaces, restartHfSpace } from './api';

function SettingsModal({ onSave, onClose, isReady }) {
  const [github, setGithub] = useState(localStorage.getItem('NEXUS_GITHUB') || '');
  const [vercel, setVercel] = useState(localStorage.getItem('NEXUS_VERCEL') || '');
  const [hf, setHf] = useState(localStorage.getItem('NEXUS_HF') || '');

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <h2>设置访问密钥 (Tokens)</h2>
        <div className="input-group">
          <label>GitHub PAT</label>
          <input type="password" value={github} onChange={e => setGithub(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Vercel Token</label>
          <input type="password" value={vercel} onChange={e => setVercel(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Hugging Face Token</label>
          <input type="password" value={hf} onChange={e => setHf(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {isReady && <button className="btn" onClick={onClose} style={{ flex: 1 }}>取消</button>}
          <button 
            className="btn primary" 
            onClick={() => {
              localStorage.setItem('NEXUS_GITHUB', github);
              localStorage.setItem('NEXUS_VERCEL', vercel);
              localStorage.setItem('NEXUS_HF', hf);
              onSave();
            }}
            style={{ flex: isReady ? 1 : 'none', width: isReady ? 'auto' : '100%' }}
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const [repos, setRepos] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState({ github: false, vercel: false, hf: false });

  const loadAllData = async () => {
    setLoading({ github: true, vercel: true, hf: true });
    
    fetchGithubRepos().then(data => { setRepos(data); setLoading(prev => ({...prev, github: false})); });
    fetchVercelDeployments().then(data => { setDeployments(data); setLoading(prev => ({...prev, vercel: false})); });
    fetchHfSpaces().then(data => { setSpaces(data); setLoading(prev => ({...prev, hf: false})); });
  };

  useEffect(() => {
    const g = localStorage.getItem('NEXUS_GITHUB');
    if (!g) setShowSettings(true);
    else {
      setReady(true);
      loadAllData();
    }
  }, []);

  const handleSaveSettings = () => {
    setShowSettings(false);
    setReady(true);
    loadAllData();
  };

  const handleRestartSpace = async (spaceId) => {
    showToast(`正在发送唤醒指令到 ${spaceId.split('/')[1]}...`);
    const success = await restartHfSpace(spaceId);
    if(success) {
      showToast('唤醒成功！云端正在启动，请等待状态变为 RUNNING。');
      loadAllData(); // reload status
    } else {
      showToast('唤醒失败，请检查密钥权限。');
    }
  };

  const navItems = [
    { id: 'all', icon: <LayoutDashboard size={20} />, label: '全部项目' },
    { id: 'github', icon: <Code size={20} />, label: 'GitHub 探针' },
    { id: 'vercel', icon: <Triangle size={20} />, label: 'Vercel 探针' },
    { id: 'hf', icon: <Box size={20} />, label: 'HuggingFace 探针' },
  ];

  return (
    <div className="nexus-container">
      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', padding: '10px 20px', borderRadius: '8px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {toast}
        </div>
      )}
      {showSettings && <SettingsModal onSave={handleSaveSettings} onClose={() => setShowSettings(false)} isReady={ready} />}
      
      <aside className="nexus-sidebar">
        <div className="sidebar-header"><Layers size={24} /> Cloud Nexus</div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              {item.icon}<span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn" style={{ width: '100%' }} onClick={() => setShowSettings(true)}>
            <Settings size={18} /> 设置密钥
          </button>
        </div>
      </aside>

      <main className="nexus-main">
        <header className="main-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          {navItems.find(i => i.id === activeTab)?.label}
          <button className="btn" onClick={loadAllData}><RefreshCw size={16} /> 刷新全部</button>
        </header>

        <div className="main-content">
          {/* GitHub Panel */}
          {(activeTab === 'all' || activeTab === 'github') && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-dim)' }}>代码仓库 (GitHub) {loading.github && '⏳'}</h3>
              <div className="card-grid">
                {repos.map(repo => (
                  <div className="item-card" key={repo.id}>
                    <div className="item-title">{repo.name}</div>
                    <div className="action-row" style={{ paddingTop: '5px' }}>
                      <a href={repo.html_url} target="_blank" className="btn"><ExternalLink size={14} /> 源码</a>
                    </div>
                  </div>
                ))}
                {repos.length === 0 && !loading.github && <p style={{color: '#94a3b8'}}>No repositories found.</p>}
              </div>
            </div>
          )}

          {/* Vercel Panel */}
          {(activeTab === 'all' || activeTab === 'vercel') && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-dim)' }}>前端部署 (Vercel) {loading.vercel && '⏳'}</h3>
              <div className="card-grid">
                {deployments.map(dep => (
                  <div className="item-card" key={dep.uid}>
                    <div className="item-title">
                      {dep.name}
                      <span className={`status-badge ${dep.state === 'READY' ? 'status-ready' : 'status-sleep'}`}>{dep.state}</span>
                    </div>
                    <div className="action-row" style={{ paddingTop: '5px' }}>
                      <a href={`https://${dep.url}`} target="_blank" className="btn primary"><Play size={14} /> 访问应用</a>
                      <a href={`https://vercel.com`} target="_blank" className="btn"><ExternalLink size={14} /> 后台</a>
                    </div>
                  </div>
                ))}
                {deployments.length === 0 && !loading.vercel && <p style={{color: '#94a3b8'}}>No deployments found.</p>}
              </div>
            </div>
          )}

          {/* Hugging Face Panel */}
          {(activeTab === 'all' || activeTab === 'hf') && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-dim)' }}>后台算力 (Hugging Face) {loading.hf && '⏳'}</h3>
              <div className="card-grid">
                {spaces.map(space => {
                  const status = space.runtime?.stage || 'SLEEPING';
                  const appUrl = `https://${space.id.replace('/', '-')}.hf.space`;
                  return (
                  <div className="item-card" key={space._id}>
                    <div className="item-title">
                      {space.id.split('/')[1]}
                      <span className={`status-badge ${status === 'RUNNING' || status === 'BUILDING' ? 'status-ready' : 'status-sleep'}`}>
                        {status}
                      </span>
                    </div>
                    <div className="action-row" style={{ paddingTop: '5px' }}>
                      <button className="btn primary" onClick={() => handleRestartSpace(space.id)}><Power size={14} /> 唤醒/重启</button>
                      <a href={appUrl} target="_blank" className="btn"><Play size={14} /> 访问应用</a>
                      <a href={`https://huggingface.co/spaces/${space.id}`} target="_blank" className="btn"><ExternalLink size={14} /> 控制台</a>
                    </div>
                  </div>
                )})}
                {spaces.length === 0 && !loading.hf && <p style={{color: '#94a3b8'}}>No spaces found.</p>}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
