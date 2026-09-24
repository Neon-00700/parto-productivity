// Standard Skill Tree — a practical map of software development skills.
// Nodes carry prerequisites; edges are derived from them (node -> deps).
// Status is NOT stored here: it is derived from the user's Technologies /
// Goal Tree (single source of truth). This file is static reference data.

export const SKILL_BRANCHES = [
  { id: 'foundations', name: { fa: 'پایه‌ها', en: 'Foundations' }, color: '#0ea5e9' },
  { id: 'frontend', name: { fa: 'فرانت‌اند', en: 'Frontend' }, color: '#6366f1' },
  { id: 'backend', name: { fa: 'بک‌اند', en: 'Backend' }, color: '#10b981' },
  { id: 'database', name: { fa: 'پایگاه داده', en: 'Database' }, color: '#f59e0b' },
  { id: 'fullstack', name: { fa: 'فول‌استک', en: 'Full Stack' }, color: '#8b5cf6' },
  { id: 'devops', name: { fa: 'دواپس و کلود', en: 'DevOps / Cloud' }, color: '#ef4444' },
  { id: 'engineering', name: { fa: 'مهندسی نرم‌افزار', en: 'Software Engineering' }, color: '#14b8a6' },
  { id: 'ai', name: { fa: 'هوش مصنوعی', en: 'AI / Machine Learning' }, color: '#ec4899' },
  { id: 'mobile', name: { fa: 'موبایل', en: 'Mobile' }, color: '#f97316' },
];

// id, branch, name, optional prereqs (ids), optional tech (matches Technology.name)
export const SKILL_NODES = [
  // ---- Foundations ----
  { id: 'prog-fundamentals', branch: 'foundations', name: { fa: 'مبانی برنامه‌نویسی', en: 'Programming Fundamentals' } },
  { id: 'problem-solving', branch: 'foundations', name: { fa: 'حل مسئله', en: 'Problem Solving' }, prereqs: ['prog-fundamentals'] },
  { id: 'algorithms', branch: 'foundations', name: { fa: 'الگوریتم‌ها', en: 'Algorithms' }, prereqs: ['problem-solving'] },
  { id: 'data-structures', branch: 'foundations', name: { fa: 'ساختار داده', en: 'Data Structures' }, prereqs: ['problem-solving'] },
  { id: 'git', branch: 'foundations', name: { fa: 'گیت', en: 'Git' } },
  { id: 'github', branch: 'foundations', name: { fa: 'گیت‌هاب', en: 'GitHub' }, prereqs: ['git'] },
  { id: 'cli', branch: 'foundations', name: { fa: 'خط فرمان (CLI)', en: 'CLI' } },
  { id: 'http', branch: 'foundations', name: { fa: 'HTTP', en: 'HTTP' } },
  { id: 'networking', branch: 'foundations', name: { fa: 'مبانی شبکه', en: 'Networking Basics' }, prereqs: ['http'] },
  { id: 'testing-basics', branch: 'foundations', name: { fa: 'مبانی تست', en: 'Testing Basics' }, prereqs: ['prog-fundamentals'] },
  { id: 'security-basics', branch: 'foundations', name: { fa: 'مبانی امنیت', en: 'Security Basics' } },

  // ---- Frontend ----
  { id: 'html', branch: 'frontend', name: { fa: 'HTML', en: 'HTML' } },
  { id: 'css', branch: 'frontend', name: { fa: 'CSS', en: 'CSS' }, prereqs: ['html'] },
  { id: 'responsive', branch: 'frontend', name: { fa: 'طراحی واکنش‌گرا', en: 'Responsive Design' }, prereqs: ['css'] },
  { id: 'accessibility', branch: 'frontend', name: { fa: 'دسترسی‌پذیری', en: 'Accessibility' }, prereqs: ['html', 'css'] },
  { id: 'javascript', branch: 'frontend', name: { fa: 'جاوااسکریپت', en: 'JavaScript' }, tech: 'JavaScript', prereqs: ['prog-fundamentals'] },
  { id: 'dom', branch: 'frontend', name: { fa: 'DOM', en: 'DOM' }, prereqs: ['javascript'] },
  { id: 'es6', branch: 'frontend', name: { fa: 'ES6+', en: 'ES6+' }, prereqs: ['javascript'] },
  { id: 'async-js', branch: 'frontend', name: { fa: 'جاوااسکریپت ناهمگام', en: 'Async JavaScript' }, prereqs: ['es6'] },
  { id: 'typescript', branch: 'frontend', name: { fa: 'تایپ‌اسکریپت', en: 'TypeScript' }, tech: 'TypeScript', prereqs: ['es6'] },
  { id: 'react', branch: 'frontend', name: { fa: 'ری‌اکت', en: 'React' }, tech: 'React', prereqs: ['javascript', 'dom'] },
  { id: 'react-hooks', branch: 'frontend', name: { fa: 'هوک‌های ری‌اکت', en: 'React Hooks' }, prereqs: ['react'] },
  { id: 'react-router', branch: 'frontend', name: { fa: 'مسیریابی (Router)', en: 'React Router' }, prereqs: ['react'] },
  { id: 'state-mgmt', branch: 'frontend', name: { fa: 'مدیریت حالت', en: 'State Management' }, prereqs: ['react-hooks'] },
  { id: 'api-integration', branch: 'frontend', name: { fa: 'اتصال به API', en: 'API Integration' }, prereqs: ['async-js', 'react'] },
  { id: 'frontend-testing', branch: 'frontend', name: { fa: 'تست فرانت‌اند', en: 'Frontend Testing' }, prereqs: ['react', 'testing-basics'] },
  { id: 'performance', branch: 'frontend', name: { fa: 'کارایی', en: 'Performance' }, prereqs: ['react'] },
  { id: 'nextjs', branch: 'frontend', name: { fa: 'نکست‌جی‌اس', en: 'Next.js' }, tech: 'Next.js', prereqs: ['react', 'typescript'] },

  // ---- Backend ----
  { id: 'backend-fundamentals', branch: 'backend', name: { fa: 'مبانی بک‌اند', en: 'Backend Fundamentals' }, prereqs: ['http'] },
  { id: 'nodejs', branch: 'backend', name: { fa: 'نود‌جی‌اس', en: 'Node.js' }, tech: 'Node.js', prereqs: ['javascript', 'backend-fundamentals'] },
  { id: 'express', branch: 'backend', name: { fa: 'اکسپرس / فریم‌ورک', en: 'Express / Frameworks' }, tech: 'Express', prereqs: ['nodejs'] },
  { id: 'rest-api', branch: 'backend', name: { fa: 'REST API', en: 'REST API' }, prereqs: ['backend-fundamentals'] },
  { id: 'authentication', branch: 'backend', name: { fa: 'احراز هویت', en: 'Authentication' }, prereqs: ['rest-api'] },
  { id: 'authorization', branch: 'backend', name: { fa: 'سطح دسترسی', en: 'Authorization' }, prereqs: ['authentication'] },
  { id: 'api-security', branch: 'backend', name: { fa: 'امنیت API', en: 'API Security' }, prereqs: ['authentication', 'security-basics'] },
  { id: 'validation', branch: 'backend', name: { fa: 'اعتبارسنجی', en: 'Validation' }, prereqs: ['rest-api'] },
  { id: 'error-handling', branch: 'backend', name: { fa: 'مدیریت خطا', en: 'Error Handling' }, prereqs: ['rest-api'] },
  { id: 'websockets', branch: 'backend', name: { fa: 'وب‌سوکت', en: 'WebSockets' }, prereqs: ['nodejs'] },
  { id: 'backend-testing', branch: 'backend', name: { fa: 'تست بک‌اند', en: 'Backend Testing' }, prereqs: ['express', 'testing-basics'] },
  { id: 'backend-arch', branch: 'backend', name: { fa: 'معماری بک‌اند', en: 'Backend Architecture' }, prereqs: ['express', 'data-design'] },

  // ---- Database ----
  { id: 'db-fundamentals', branch: 'database', name: { fa: 'مبانی پایگاه داده', en: 'Database Fundamentals' } },
  { id: 'sql', branch: 'database', name: { fa: 'SQL', en: 'SQL' }, tech: 'SQL', prereqs: ['db-fundamentals'] },
  { id: 'relational', branch: 'database', name: { fa: 'پایگاه‌های رابطه‌ای', en: 'Relational Databases' }, prereqs: ['sql'] },
  { id: 'postgresql', branch: 'database', name: { fa: 'پست‌گرس‌کیوال', en: 'PostgreSQL' }, tech: 'PostgreSQL', prereqs: ['relational'] },
  { id: 'data-design', branch: 'database', name: { fa: 'طراحی پایگاه داده', en: 'Database Design' }, prereqs: ['relational'] },
  { id: 'indexing', branch: 'database', name: { fa: 'ایندکس‌گذاری', en: 'Indexing' }, prereqs: ['sql'] },
  { id: 'transactions', branch: 'database', name: { fa: 'تراکنش‌ها', en: 'Transactions' }, prereqs: ['sql'] },
  { id: 'nosql', branch: 'database', name: { fa: 'مفاهیم NoSQL', en: 'NoSQL Concepts' }, prereqs: ['db-fundamentals'] },
  { id: 'mongodb', branch: 'database', name: { fa: 'مونگو‌دی‌بی', en: 'MongoDB' }, tech: 'MongoDB', prereqs: ['nosql'] },
  { id: 'caching', branch: 'database', name: { fa: 'کش کردن', en: 'Caching' }, prereqs: ['db-fundamentals'] },
  { id: 'redis', branch: 'database', name: { fa: 'ردیس', en: 'Redis' }, tech: 'Redis', prereqs: ['caching'] },

  // ---- Full Stack ----
  { id: 'fullstack-web', branch: 'fullstack', name: { fa: 'وب فول‌استک', en: 'Full Stack Web Development' }, tech: 'Full Stack',
    prereqs: ['frontend-testing', 'backend-arch', 'data-design', 'authentication', 'deployment'] },

  // ---- DevOps / Cloud ----
  { id: 'linux-basics', branch: 'devops', name: { fa: 'مبانی لینوکس', en: 'Linux Basics' }, prereqs: ['cli'] },
  { id: 'docker', branch: 'devops', name: { fa: 'داکر', en: 'Docker' }, tech: 'Docker', prereqs: ['linux-basics'] },
  { id: 'containers', branch: 'devops', name: { fa: 'کانتینرها', en: 'Containers' }, prereqs: ['docker'] },
  { id: 'cicd', branch: 'devops', name: { fa: 'CI/CD', en: 'CI/CD' }, prereqs: ['docker', 'github'] },
  { id: 'deployment', branch: 'devops', name: { fa: 'استقرار (Deployment)', en: 'Deployment' }, prereqs: ['docker'] },
  { id: 'cloud-fundamentals', branch: 'devops', name: { fa: 'مبانی کلود', en: 'Cloud Fundamentals' }, prereqs: ['networking'] },
  { id: 'monitoring', branch: 'devops', name: { fa: 'مانیتورینگ', en: 'Monitoring' }, prereqs: ['deployment'] },
  { id: 'env-management', branch: 'devops', name: { fa: 'مدیریت محیط‌ها', en: 'Environment Management' }, prereqs: ['deployment'] },

  // ---- Software Engineering ----
  { id: 'clean-code', branch: 'engineering', name: { fa: 'کد تمیز', en: 'Clean Code' }, prereqs: ['prog-fundamentals'] },
  { id: 'design-patterns', branch: 'engineering', name: { fa: 'الگوهای طراحی', en: 'Design Patterns' }, prereqs: ['clean-code'] },
  { id: 'architecture', branch: 'engineering', name: { fa: 'معماری نرم‌افزار', en: 'Architecture' }, prereqs: ['design-patterns'] },
  { id: 'solid', branch: 'engineering', name: { fa: 'اصول SOLID', en: 'SOLID' }, prereqs: ['clean-code'] },
  { id: 'eng-testing', branch: 'engineering', name: { fa: 'تست نرم‌افزار', en: 'Testing' }, prereqs: ['clean-code', 'testing-basics'] },
  { id: 'debugging', branch: 'engineering', name: { fa: 'دیباگ کردن', en: 'Debugging' }, prereqs: ['prog-fundamentals'] },
  { id: 'code-review', branch: 'engineering', name: { fa: 'بازبینی کد', en: 'Code Review' }, prereqs: ['clean-code'] },
  { id: 'system-design', branch: 'engineering', name: { fa: 'طراحی سیستم', en: 'System Design' }, prereqs: ['architecture', 'backend-arch'] },
  { id: 'scalability', branch: 'engineering', name: { fa: 'مقیاس‌پذیری', en: 'Scalability' }, prereqs: ['system-design'] },

  // ---- AI / ML ----
  { id: 'python', branch: 'ai', name: { fa: 'پایتون', en: 'Python' }, tech: 'Python', prereqs: ['prog-fundamentals'] },
  { id: 'math-basics', branch: 'ai', name: { fa: 'مبانی ریاضی', en: 'Mathematics Basics' } },
  { id: 'statistics', branch: 'ai', name: { fa: 'آمار', en: 'Statistics' }, prereqs: ['math-basics'] },
  { id: 'data-handling', branch: 'ai', name: { fa: 'مدیریت داده', en: 'Data Handling' }, prereqs: ['python'] },
  { id: 'numpy', branch: 'ai', name: { fa: 'NumPy', en: 'NumPy' }, tech: 'NumPy', prereqs: ['data-handling'] },
  { id: 'pandas', branch: 'ai', name: { fa: 'Pandas', en: 'Pandas' }, tech: 'Pandas', prereqs: ['data-handling'] },
  { id: 'ml-fundamentals', branch: 'ai', name: { fa: 'مبانی یادگیری ماشین', en: 'ML Fundamentals' }, prereqs: ['statistics', 'numpy'] },
  { id: 'supervised', branch: 'ai', name: { fa: 'یادگیری نظارت‌شده', en: 'Supervised Learning' }, prereqs: ['ml-fundamentals'] },
  { id: 'unsupervised', branch: 'ai', name: { fa: 'یادگیری بدون نظارت', en: 'Unsupervised Learning' }, prereqs: ['ml-fundamentals'] },
  { id: 'deep-learning', branch: 'ai', name: { fa: 'یادگیری عمیق', en: 'Deep Learning' }, prereqs: ['supervised'] },
  { id: 'neural-nets', branch: 'ai', name: { fa: 'شبکه‌های عصبی', en: 'Neural Networks' }, prereqs: ['deep-learning'] },
  { id: 'nlp', branch: 'ai', name: { fa: 'پردازش زبان طبیعی', en: 'NLP' }, prereqs: ['deep-learning'] },
  { id: 'llm-fundamentals', branch: 'ai', name: { fa: 'مبانی LLM', en: 'LLM Fundamentals' }, prereqs: ['nlp'] },
  { id: 'prompt-engineering', branch: 'ai', name: { fa: 'مهندسی پرامپت', en: 'Prompt Engineering' }, prereqs: ['llm-fundamentals'] },
  { id: 'rag', branch: 'ai', name: { fa: 'RAG', en: 'RAG' }, prereqs: ['llm-fundamentals', 'data-handling'] },
  { id: 'ai-agents', branch: 'ai', name: { fa: 'عامل‌های هوش مصنوعی', en: 'AI Agents' }, prereqs: ['llm-fundamentals'] },
  { id: 'ai-engineering', branch: 'ai', name: { fa: 'مهندسی هوش مصنوعی', en: 'AI Engineering' }, tech: 'AI Engineering', prereqs: ['ai-agents', 'rag', 'model-apis'] },
  { id: 'model-apis', branch: 'ai', name: { fa: 'API مدل‌ها', en: 'Model APIs' }, prereqs: ['llm-fundamentals'] },
  { id: 'ai-app-dev', branch: 'ai', name: { fa: 'توسعه اپ هوش مصنوعی', en: 'AI Application Development' }, prereqs: ['ai-engineering', 'api-integration'] },

  // ---- Mobile ----
  { id: 'mobile-fundamentals', branch: 'mobile', name: { fa: 'مبانی موبایل', en: 'Mobile Fundamentals' } },
  { id: 'react-native', branch: 'mobile', name: { fa: 'ری‌اکت نیتیو', en: 'React Native' }, tech: 'React Native', prereqs: ['react', 'mobile-fundamentals'] },
  { id: 'flutter', branch: 'mobile', name: { fa: 'فلاتر', en: 'Flutter' }, tech: 'Flutter', prereqs: ['mobile-fundamentals'] },
  { id: 'native-concepts', branch: 'mobile', name: { fa: 'مفاهیم توسعه نیتیو', en: 'Native Development Concepts' }, prereqs: ['mobile-fundamentals'] },
];

export const SKILL_BY_ID = Object.fromEntries(SKILL_NODES.map((n) => [n.id, n]));
export const BRANCH_BY_ID = Object.fromEntries(SKILL_BRANCHES.map((b) => [b.id, b]));
