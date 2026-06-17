import sqlite3 from 'sqlite3';
import crypto from 'crypto';

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

interface MockUser {
  id: string;
  name: string;
  role: 'admin' | 'researcher';
  avatar: string;
  department: string;
  username: string;
  password: string;
  title?: string;
  skills?: string[];
}

interface MockProject {
  id: string;
  name: string;
  subject: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  leaderId: string;
  memberIds: string[];
}

interface MockNode {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  assigneeId: string;
  achievements: string[];
  difficulties: string[];
  priority: 'low' | 'medium' | 'high';
}

export const mockData = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const addDays = (d: Date, days: number) => {
      const result = new Date(d);
      result.setDate(result.getDate() + days);
      return result;
    };

    const users: MockUser[] = [
      { id: 'admin1', name: '张伟', role: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin1', department: '科研管理处', username: 'admin', password: 'admin123', title: '科研副院长', skills: ['项目管理', '资源协调', '战略规划'] },
      { id: 'admin2', name: '李娜', role: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin2', department: '科研管理处', username: 'admin2', password: 'admin123', title: '项目主管', skills: ['质量管理', '进度跟踪', '数据分析'] },
      { id: 'res1', name: '王明', role: 'researcher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=res1', department: '物理系', username: 'researcher1', password: '123456', title: '教授', skills: ['量子计算', '凝聚态物理', '材料表征'] },
      { id: 'res2', name: '陈静', role: 'researcher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=res2', department: '化学系', username: 'researcher2', password: '123456', title: '副教授', skills: ['有机合成', '催化反应', '光谱分析'] },
      { id: 'res3', name: '刘洋', role: 'researcher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=res3', department: '生物系', username: 'researcher3', password: '123456', title: '研究员', skills: ['基因编辑', '细胞培养', '生物信息学'] },
      { id: 'res4', name: '赵芳', role: 'researcher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=res4', department: '计算机系', username: 'researcher4', password: '123456', title: '教授', skills: ['人工智能', '机器学习', '数据挖掘'] },
      { id: 'res5', name: '孙强', role: 'researcher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=res5', department: '材料系', username: 'researcher5', password: '123456', title: '副教授', skills: ['纳米材料', '复合材料', '材料合成'] },
      { id: 'res6', name: '周丽', role: 'researcher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=res6', department: '环境系', username: 'researcher6', password: '123456', title: '研究员', skills: ['环境监测', '废水处理', '生态修复'] },
      { id: 'res7', name: '吴鹏', role: 'researcher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=res7', department: '物理系', username: 'researcher7', password: '123456', title: '讲师', skills: ['光学工程', '激光技术', '光谱学'] },
      { id: 'res8', name: '郑雪', role: 'researcher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=res8', department: '化学系', username: 'researcher8', password: '123456', title: '讲师', skills: ['分析化学', '电化学', '材料表征'] },
    ];

    const projects: MockProject[] = [
      {
        id: 'proj1', name: '超导量子比特的相干时间优化研究', subject: '物理学',
        description: '研究超导量子比特的退相干机制，通过材料优化和结构设计延长相干时间，为大规模量子计算奠定基础。',
        startDate: formatDate(addDays(today, -90)), endDate: formatDate(addDays(today, 180)),
        status: 'in_progress', progress: 45, leaderId: 'res1', memberIds: ['res1', 'res7']
      },
      {
        id: 'proj2', name: '新型MOF材料的催化性能研究', subject: '化学',
        description: '设计合成具有高比表面积的金属有机框架材料，研究其在CO2还原和有机合成中的催化应用。',
        startDate: formatDate(addDays(today, -60)), endDate: formatDate(addDays(today, 240)),
        status: 'in_progress', progress: 30, leaderId: 'res2', memberIds: ['res2', 'res8']
      },
      {
        id: 'proj3', name: 'CRISPR基因编辑在罕见病治疗中的应用', subject: '生物学',
        description: '开发高效精准的CRISPR基因编辑技术，研究其在血友病、地中海贫血等罕见病治疗中的安全性和有效性。',
        startDate: formatDate(addDays(today, -120)), endDate: formatDate(addDays(today, 60)),
        status: 'delayed', progress: 65, leaderId: 'res3', memberIds: ['res3']
      },
      {
        id: 'proj4', name: '多模态大语言模型的医学知识推理研究', subject: '计算机科学',
        description: '融合文本、图像、基因等多模态数据，构建面向医学领域的大语言模型，提升临床决策支持能力。',
        startDate: formatDate(addDays(today, -30)), endDate: formatDate(addDays(today, 300)),
        status: 'in_progress', progress: 15, leaderId: 'res4', memberIds: ['res4', 'res3']
      },
      {
        id: 'proj5', name: '二维过渡金属硫化物的光电性能调控', subject: '材料科学',
        description: '研究二维TMDS材料的能带结构调控，制备高性能光电探测器和谷电子器件。',
        startDate: formatDate(addDays(today, -45)), endDate: formatDate(addDays(today, 210)),
        status: 'in_progress', progress: 25, leaderId: 'res5', memberIds: ['res5', 'res7']
      },
      {
        id: 'proj6', name: '城市黑臭水体治理的微生物强化技术', subject: '环境科学',
        description: '筛选高效降解污染物的功能微生物菌群，开发微生物-植物联合修复技术，应用于城市黑臭水体治理。',
        startDate: formatDate(addDays(today, -15)), endDate: formatDate(addDays(today, 270)),
        status: 'planning', progress: 5, leaderId: 'res6', memberIds: ['res6', 'res3']
      },
    ];

    const nodes: MockNode[] = [
      { id: 'proj1-n1', projectId: 'proj1', title: '文献调研与理论建模', description: '系统调研超导量子比特研究进展，建立退相干理论模型', startDate: formatDate(addDays(today, -90)), endDate: formatDate(addDays(today, -60)), status: 'completed', progress: 100, assigneeId: 'res1', achievements: ['完成200篇文献综述', '建立退相干理论模型'], difficulties: [], priority: 'high' },
      { id: 'proj1-n2', projectId: 'proj1', title: '样品制备与材料表征', description: '制备Al/AlOx/Al约瑟夫森结样品，进行AFM、TEM表征', startDate: formatDate(addDays(today, -59)), endDate: formatDate(addDays(today, -30)), status: 'completed', progress: 100, assigneeId: 'res7', achievements: ['成功制备5批样品', '获得高质量TEM图像'], difficulties: ['部分样品氧化层厚度不均'], priority: 'high' },
      { id: 'proj1-n3', projectId: 'proj1', title: '低温输运测量', description: '在mK级低温下进行输运测量，表征量子比特基本参数', startDate: formatDate(addDays(today, -29)), endDate: formatDate(addDays(today, 15)), status: 'in_progress', progress: 60, assigneeId: 'res1', achievements: ['完成3个样品的测量', '观测到量子化能级'], difficulties: ['低温系统稳定性需优化'], priority: 'high' },
      { id: 'proj1-n4', projectId: 'proj1', title: '相干时间测量与分析', description: '测量T1、T2*、T2等相干时间参数，分析退相干机制', startDate: formatDate(addDays(today, 16)), endDate: formatDate(addDays(today, 60)), status: 'pending', progress: 0, assigneeId: 'res7', achievements: [], difficulties: [], priority: 'high' },
      { id: 'proj1-n5', projectId: 'proj1', title: '材料优化方案设计', description: '基于退相干分析结果，设计材料优化方案', startDate: formatDate(addDays(today, 61)), endDate: formatDate(addDays(today, 100)), status: 'pending', progress: 0, assigneeId: 'res1', achievements: [], difficulties: [], priority: 'medium' },
      { id: 'proj1-n6', projectId: 'proj1', title: '优化样品制备与测试', description: '制备优化后的样品并进行性能测试', startDate: formatDate(addDays(today, 101)), endDate: formatDate(addDays(today, 150)), status: 'pending', progress: 0, assigneeId: 'res7', achievements: [], difficulties: [], priority: 'high' },
      { id: 'proj1-n7', projectId: 'proj1', title: '论文撰写与成果总结', description: '整理实验数据，撰写研究论文，总结项目成果', startDate: formatDate(addDays(today, 151)), endDate: formatDate(addDays(today, 180)), status: 'pending', progress: 0, assigneeId: 'res1', achievements: [], difficulties: [], priority: 'medium' },

      { id: 'proj2-n1', projectId: 'proj2', title: 'MOF结构设计与理论计算', description: '通过DFT计算设计具有高催化活性的MOF结构', startDate: formatDate(addDays(today, -60)), endDate: formatDate(addDays(today, -35)), status: 'completed', progress: 100, assigneeId: 'res2', achievements: ['完成12种MOF结构优化', '预测3种高活性结构'], difficulties: ['计算资源紧张'], priority: 'high' },
      { id: 'proj2-n2', projectId: 'proj2', title: 'MOF材料合成与表征', description: '水热法合成目标MOF材料，进行XRD、BET、SEM表征', startDate: formatDate(addDays(today, -34)), endDate: formatDate(addDays(today, 5)), status: 'delayed', progress: 75, assigneeId: 'res8', achievements: ['成功合成2种目标MOF', 'BET表面积达到3500 m2/g'], difficulties: ['部分相纯度不高', '合成重复性有待提高'], priority: 'high' },
      { id: 'proj2-n3', projectId: 'proj2', title: 'CO2还原催化性能测试', description: '构建电催化CO2还原反应体系，测试催化活性和选择性', startDate: formatDate(addDays(today, 6)), endDate: formatDate(addDays(today, 50)), status: 'pending', progress: 0, assigneeId: 'res2', achievements: [], difficulties: [], priority: 'high' },
      { id: 'proj2-n4', projectId: 'proj2', title: '催化机理原位表征', description: '使用原位红外、拉曼光谱研究催化反应机理', startDate: formatDate(addDays(today, 51)), endDate: formatDate(addDays(today, 100)), status: 'pending', progress: 0, assigneeId: 'res8', achievements: [], difficulties: [], priority: 'medium' },
      { id: 'proj2-n5', projectId: 'proj2', title: '催化剂循环稳定性测试', description: '进行多次循环实验，评估催化剂稳定性', startDate: formatDate(addDays(today, 101)), endDate: formatDate(addDays(today, 150)), status: 'pending', progress: 0, assigneeId: 'res2', achievements: [], difficulties: [], priority: 'medium' },
      { id: 'proj2-n6', projectId: 'proj2', title: '成果总结与论文撰写', description: '整理数据，撰写研究论文和技术报告', startDate: formatDate(addDays(today, 151)), endDate: formatDate(addDays(today, 240)), status: 'pending', progress: 0, assigneeId: 'res2', achievements: [], difficulties: [], priority: 'low' },

      { id: 'proj3-n1', projectId: 'proj3', title: 'sgRNA设计与筛选', description: '设计靶向致病基因的sgRNA，进行体外活性筛选', startDate: formatDate(addDays(today, -120)), endDate: formatDate(addDays(today, -90)), status: 'completed', progress: 100, assigneeId: 'res3', achievements: ['设计20条sgRNA', '筛选出3条高活性序列'], difficulties: [], priority: 'high' },
      { id: 'proj3-n2', projectId: 'proj3', title: '基因编辑载体构建', description: '构建AAV介导的CRISPR基因编辑递送系统', startDate: formatDate(addDays(today, -89)), endDate: formatDate(addDays(today, -60)), status: 'completed', progress: 100, assigneeId: 'res3', achievements: ['成功构建4种重组载体', '载体滴度达到1e12 vg/ml'], difficulties: ['载体包装效率偏低'], priority: 'high' },
      { id: 'proj3-n3', projectId: 'proj3', title: '细胞水平基因编辑验证', description: '在患者来源的细胞系中验证基因编辑效率和特异性', startDate: formatDate(addDays(today, -59)), endDate: formatDate(addDays(today, -15)), status: 'delayed', progress: 80, assigneeId: 'res3', achievements: ['基因编辑效率达到45%', '未检测到显著脱靶效应'], difficulties: ['部分细胞系转染效率低', '需要优化培养条件'], priority: 'high' },
      { id: 'proj3-n4', projectId: 'proj3', title: '动物模型体内实验', description: '在血友病小鼠模型中进行体内基因编辑实验', startDate: formatDate(addDays(today, -14)), endDate: formatDate(addDays(today, 30)), status: 'delayed', progress: 30, assigneeId: 'res3', achievements: ['完成首批小鼠给药', '观察到初步治疗效果'], difficulties: ['动物实验周期超预期'], priority: 'high' },
      { id: 'proj3-n5', projectId: 'proj3', title: '安全性评估', description: '全面评估基因编辑的安全性，包括免疫原性、脱靶效应等', startDate: formatDate(addDays(today, 31)), endDate: formatDate(addDays(today, 60)), status: 'pending', progress: 0, assigneeId: 'res3', achievements: [], difficulties: [], priority: 'high' },

      { id: 'proj4-n1', projectId: 'proj4', title: '多模态医学数据集构建', description: '收集整理医学文本、影像、基因数据，构建多模态数据集', startDate: formatDate(addDays(today, -30)), endDate: formatDate(addDays(today, 10)), status: 'in_progress', progress: 65, assigneeId: 'res4', achievements: ['收集10万份医学文献', '整理5000份影像报告'], difficulties: ['数据标准化难度大', '涉及隐私保护问题'], priority: 'high' },
      { id: 'proj4-n2', projectId: 'proj4', title: '多模态融合算法研究', description: '研究多模态特征融合算法，实现跨模态知识对齐', startDate: formatDate(addDays(today, 11)), endDate: formatDate(addDays(today, 80)), status: 'pending', progress: 0, assigneeId: 'res4', achievements: [], difficulties: [], priority: 'high' },
      { id: 'proj4-n3', projectId: 'proj4', title: '医学领域大模型预训练', description: '在医学多模态数据上进行大模型持续预训练', startDate: formatDate(addDays(today, 81)), endDate: formatDate(addDays(today, 160)), status: 'pending', progress: 0, assigneeId: 'res4', achievements: [], difficulties: [], priority: 'high' },
      { id: 'proj4-n4', projectId: 'proj4', title: '知识推理能力评测', description: '构建医学问答评测集，评估模型知识推理能力', startDate: formatDate(addDays(today, 161)), endDate: formatDate(addDays(today, 220)), status: 'pending', progress: 0, assigneeId: 'res3', achievements: [], difficulties: [], priority: 'medium' },
      { id: 'proj4-n5', projectId: 'proj4', title: '临床决策支持原型系统', description: '开发临床决策支持原型系统，进行初步临床验证', startDate: formatDate(addDays(today, 221)), endDate: formatDate(addDays(today, 300)), status: 'pending', progress: 0, assigneeId: 'res4', achievements: [], difficulties: [], priority: 'medium' },

      { id: 'proj5-n1', projectId: 'proj5', title: '二维TMDS材料制备', description: '使用CVD法制备单层和少层TMDS材料', startDate: formatDate(addDays(today, -45)), endDate: formatDate(addDays(today, -15)), status: 'completed', progress: 100, assigneeId: 'res5', achievements: ['成功制备MoS2、WS2单层样品', '尺寸达到100μm'], difficulties: [], priority: 'high' },
      { id: 'proj5-n2', projectId: 'proj5', title: '掺杂与缺陷调控', description: '研究等离子体处理和化学掺杂对材料性能的调控', startDate: formatDate(addDays(today, -14)), endDate: formatDate(addDays(today, 25)), status: 'in_progress', progress: 55, assigneeId: 'res7', achievements: ['实现n型和p型掺杂', '载流子浓度调控范围达3个数量级'], difficulties: ['掺杂均匀性控制'], priority: 'high' },
      { id: 'proj5-n3', projectId: 'proj5', title: '光电探测器器件制备', description: '制备基于二维TMDS的光电探测器器件', startDate: formatDate(addDays(today, 26)), endDate: formatDate(addDays(today, 70)), status: 'pending', progress: 0, assigneeId: 'res5', achievements: [], difficulties: [], priority: 'high' },
      { id: 'proj5-n4', projectId: 'proj5', title: '光电性能表征', description: '表征探测器的响应度、探测率、响应速度等关键参数', startDate: formatDate(addDays(today, 71)), endDate: formatDate(addDays(today, 120)), status: 'pending', progress: 0, assigneeId: 'res7', achievements: [], difficulties: [], priority: 'high' },
      { id: 'proj5-n5', projectId: 'proj5', title: '谷电子学器件研究', description: '探索二维TMDS在谷电子学器件中的应用', startDate: formatDate(addDays(today, 121)), endDate: formatDate(addDays(today, 180)), status: 'pending', progress: 0, assigneeId: 'res5', achievements: [], difficulties: [], priority: 'medium' },
      { id: 'proj5-n6', projectId: 'proj5', title: '成果总结与论文撰写', description: '整理实验数据，撰写研究论文', startDate: formatDate(addDays(today, 181)), endDate: formatDate(addDays(today, 210)), status: 'pending', progress: 0, assigneeId: 'res5', achievements: [], difficulties: [], priority: 'low' },

      { id: 'proj6-n1', projectId: 'proj6', title: '污染水体微生物群落分析', description: '采集黑臭水体样本，分析微生物群落结构和功能', startDate: formatDate(addDays(today, -15)), endDate: formatDate(addDays(today, 20)), status: 'in_progress', progress: 40, assigneeId: 'res6', achievements: ['完成3个采样点样本采集', '完成16S rRNA测序'], difficulties: ['采样点交通不便'], priority: 'high' },
      { id: 'proj6-n2', projectId: 'proj6', title: '功能微生物筛选与驯化', description: '筛选高效降解污染物的功能菌株并进行驯化', startDate: formatDate(addDays(today, 21)), endDate: formatDate(addDays(today, 80)), status: 'pending', progress: 0, assigneeId: 'res6', achievements: [], difficulties: [], priority: 'high' },
      { id: 'proj6-n3', projectId: 'proj6', title: '微生物菌剂制备优化', description: '优化菌剂培养条件和保存方法，提高菌剂活性', startDate: formatDate(addDays(today, 81)), endDate: formatDate(addDays(today, 140)), status: 'pending', progress: 0, assigneeId: 'res3', achievements: [], difficulties: [], priority: 'medium' },
      { id: 'proj6-n4', projectId: 'proj6', title: '微生物-植物联合修复体系构建', description: '构建微生物-水生植物联合修复体系', startDate: formatDate(addDays(today, 141)), endDate: formatDate(addDays(today, 200)), status: 'pending', progress: 0, assigneeId: 'res6', achievements: [], difficulties: [], priority: 'high' },
      { id: 'proj6-n5', projectId: 'proj6', title: '现场中试实验', description: '在实际黑臭水体中进行修复技术中试实验', startDate: formatDate(addDays(today, 201)), endDate: formatDate(addDays(today, 270)), status: 'pending', progress: 0, assigneeId: 'res6', achievements: [], difficulties: [], priority: 'high' },
    ];

    db.serialize(() => {
      const stmtUser = db.prepare('INSERT INTO users (id, name, role, avatar, department, username, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)');
      users.forEach(user => {
        stmtUser.run(user.id, user.name, user.role, user.avatar, user.department, user.username, hashPassword(user.password));
      });
      stmtUser.finalize();

      const stmtProject = db.prepare('INSERT INTO projects (id, name, subject, description, start_date, end_date, status, progress, leader_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      projects.forEach(proj => {
        stmtProject.run(proj.id, proj.name, proj.subject, proj.description, proj.startDate, proj.endDate, proj.status, proj.progress, proj.leaderId);
      });
      stmtProject.finalize();

      const stmtNode = db.prepare('INSERT INTO project_nodes (id, project_id, title, description, start_date, end_date, status, progress, assignee_id, achievements, difficulties, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      nodes.forEach(node => {
        stmtNode.run(node.id, node.projectId, node.title, node.description, node.startDate, node.endDate, node.status, node.progress, node.assigneeId, JSON.stringify(node.achievements), JSON.stringify(node.difficulties), node.priority);
      });
      stmtNode.finalize();

      const stmtAssignment = db.prepare('INSERT INTO member_assignments (id, member_id, project_id, node_id, role) VALUES (?, ?, ?, ?, ?)');
      let assignId = 1;
      nodes.forEach(node => {
        const project = projects.find(p => p.id === node.projectId);
        if (project) {
          stmtAssignment.run(`assign${assignId++}`, node.assigneeId, node.projectId, node.id, '执行人');
        }
      });

      projects.forEach(proj => {
        const leader = users.find(u => u.id === proj.leaderId);
        if (leader && !nodes.some(n => n.projectId === proj.id && n.assigneeId === proj.leaderId)) {
          stmtAssignment.run(`assign${assignId++}`, proj.leaderId, proj.id, '', '项目负责人');
        }
      });
      stmtAssignment.finalize();

      resolve();
    });
  });
};
