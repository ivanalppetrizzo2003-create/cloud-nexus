const getHeaders = (platform) => {
  const tokens = {
    github: localStorage.getItem('NEXUS_GITHUB'),
    vercel: localStorage.getItem('NEXUS_VERCEL'),
    hf: localStorage.getItem('NEXUS_HF'),
  };
  
  if (platform === 'github') return { Authorization: `Bearer ${tokens.github}`, Accept: 'application/vnd.github.v3+json' };
  if (platform === 'vercel') return { Authorization: `Bearer ${tokens.vercel}` };
  if (platform === 'hf') return { Authorization: `Bearer ${tokens.hf}` };
  return {};
};

// ================= GITHUB API =================
export const fetchGithubRepos = async () => {
  try {
    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
      headers: getHeaders('github')
    });
    if (!res.ok) throw new Error('Failed to fetch GitHub repos');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

// ================= VERCEL API =================
export const fetchVercelDeployments = async () => {
  try {
    const res = await fetch('https://api.vercel.com/v6/deployments?limit=10', {
      headers: getHeaders('vercel')
    });
    if (!res.ok) throw new Error('Failed to fetch Vercel deployments');
    const data = await res.json();
    return data.deployments || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

// ================= HUGGING FACE API =================
export const fetchHfSpaces = async () => {
  try {
    // 1. Get username
    const meRes = await fetch('https://huggingface.co/api/whoami-v2', { headers: getHeaders('hf') });
    if (!meRes.ok) throw new Error('Failed to fetch HF user');
    const meData = await meRes.json();
    const username = meData.name;

    // 2. Get spaces
    const spacesRes = await fetch(`https://huggingface.co/api/spaces?author=${username}&full=true`, { 
      headers: getHeaders('hf') 
    });
    if (!spacesRes.ok) throw new Error('Failed to fetch HF spaces');
    return await spacesRes.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const restartHfSpace = async (spaceId) => {
  try {
    const res = await fetch(`https://huggingface.co/api/spaces/${spaceId}/restart`, {
      method: 'POST',
      headers: getHeaders('hf')
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};
