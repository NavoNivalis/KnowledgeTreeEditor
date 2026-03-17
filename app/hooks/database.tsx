import { supabase } from '../lib/supabase';

//测试用的账号
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';//暂时没做登录逻辑，所以强行用这个id

//获取当前账号
const getCurrentUserId = async () => {
  return TEST_USER_ID; 
};

//节点数组的数据结构
export interface TreeNode {
  id: string;
  label: string;
  level: number;
  order: number;
  parentId: string | null;
  branch: 'left' | 'right';
  x: number;
  y: number;
  tree_id: string;
}


//获取用户的节点树列表
export const getUserTrees = async () => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

//i：节点树id   o：树概要信息
export const getTreeById = async (treeId: string) => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .eq('id', treeId)
    .eq('user_id', userId) // 🔥 权限：只能查自己的树
    .maybeSingle();

  if (error) throw error;
  return data; // 不存在返回null
};



//i：节点树id，节点数组 o：删除已存在的节点，重新把所有节点插入，达到数据库更新节点数组
export const saveTreeNodes = async (treeId: string, nodes: TreeNode[]) => {
  await supabase
    .from('tree_nodes')
    .delete()
    .eq('tree_id', treeId);

  const dbNodes = nodes.map(node => ({
    id: node.id,
    tree_id: treeId,
    label: node.label,
    level: node.level,
    order: node.order,
    parentId: node.parentId,
    branch: node.branch,
    x: node.x,
    y: node.y,
  }));

  const { data, error } = await supabase
    .from('tree_nodes')
    .insert(dbNodes)
    .select();

  if (error) throw error;
  return data;
};

//i：节点树id  o：返回数据库里的节点树组
export const loadTreeNodes = async (treeId: string): Promise<TreeNode[]> => {
  const { data, error } = await supabase
    .from('tree_nodes')
    .select('*')
    .eq('tree_id', treeId);

  if (error) throw error;

  return data.map((node:any )=> ({
    id: node.id,
    label: node.label,
    level: node.level,
    order: node.order,
    parentId: node.parentId,
    branch: node.branch,
    x: node.x,
    y: node.y,
    tree_id: node.tree_id,
  }));
};

//i：节点id，新label  o：修改数据库节点的label
export const updateNodeLabel = async (nodeId: string, label: string) => {
  const { data, error } = await supabase
    .from('tree_nodes')
    .update({ label })
    .eq('id', nodeId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ======================
// 笔记操作
// ======================

//i：标题，笔记所属的节点id  o：数据库新建节点
export const createNote = async (title: string, nodeId: string) => {
  const noteId = `note_${Date.now()}`;

  const { data, error } = await supabase
    .from("notes")
    .insert({
      id: noteId,
      node_id: nodeId,
      title: title,
      content: "",
    })
    .select()
    .single();

  if (error) {
    console.error("createNote 错误:", error);
    throw new Error("创建笔记失败");
  }
  return data;
};

//i：笔记id， o：返回笔记数据
export const getNoteByNoteId = async (noteId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId) // ✅ 这里改成 id，不是 node_id！
    .single();

  if (error) {
    console.error("获取笔记失败:", error);
    return null;
  }
  return data;
};

//i：笔记id，内容   o：更新笔记
export const updateNoteContent = async (noteId: string, content: string) => {
  const { data, error } = await supabase
    .from('notes')
    .update({ content })
    .eq('id', noteId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

//i：节点id    o：删除节点对应的笔记
export const deleteNoteByNodeId = async (nodeId: string) => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('node_id', nodeId);

  if (error) throw error;
};


// i：节点id    o：返回节点对应的笔记数据
export const getNoteByNodeId = async (nodeId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('node_id', nodeId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// i：节点id，标题，内容    o：保存节点对应的笔记内容（存在则更新，不存在则插入），如果不存在笔记，则新建一条笔记
export const saveNote = async (nodeId: string, title: string, content: string) => {
  const existing = await getNoteByNodeId(nodeId);

  if (existing) {
    // 更新
    const { error } = await supabase
      .from('notes')
      .update({ title, content })
      .eq('node_id', nodeId);

    if (error) throw error;
    return true;
  } else {
    // 新增
    const { error } = await supabase
      .from('notes')
      .insert([
        {
          node_id: nodeId,
          title,
          content
        }
      ]);

    if (error) throw error;
    return true;
  }
};

//sidebar用
// ========== 认知树：新建 ==========
// 树操作
// ======================
//i：认知树标题  o：新建认知树概要
export const createTree = async (title: string) => {
  const treeId = `tree_${Date.now()}`;
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('trees')
    .insert({
      id: treeId,
      user_id: userId,
      title: title.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('创建树失败', error);
    throw error;
  }

  return data;
};

// ========== 认知树：删除（级联删除节点 + 笔记） ==========
// i：认知树id   o：遍历认知树所属的节点，再遍历节点对应的笔记，把笔记全部删除，然后把节点删除，最后把认知树删除
export async function deleteTree(treeId: string): Promise<void> {
  console.log("=== deleteTree 执行 ===");
  console.log("删除 treeId =", treeId);

  try {
    // 1. 先查出该树下所有节点的 ID
    const { data: nodes, error: fetchNodesError } = await supabase
      .from('tree_nodes')
      .select('id')
      .eq('tree_id', treeId);

    if (fetchNodesError) throw fetchNodesError;

    const nodeIds = nodes ? nodes.map(n => n.id) : [];
    console.log("要删除的节点 ID 列表 =", nodeIds);

    // 2. 如果有节点，先删除这些节点的笔记（通过 node_id）
    if (nodeIds.length > 0) {
      const { error: noteError } = await supabase
        .from('notes')
        .delete()
        .in('node_id', nodeIds);

      if (noteError) throw noteError;
      console.log("✅ 笔记删除成功");
    }

    // 3. 删除该树下所有节点
    const { error: nodeError } = await supabase
      .from('tree_nodes')
      .delete()
      .eq('tree_id', treeId);

    if (nodeError) throw nodeError;
    console.log("✅ 节点删除成功");

    // 4. 删除树本身
    const { error: treeError } = await supabase
      .from('trees')
      .delete()
      .eq('id', treeId);

    if (treeError) throw treeError;
    console.log("✅ 树删除成功");

    console.log("✅ 树 + 节点 + 笔记 全部级联删除成功");
  } catch (err) {
    console.error("❌ 删除树失败", err);
    throw err;
  }
}

//i： 认知树id 新的标题   o：更新认知树名称
// ========== 认知树：修改名称 ==========
export async function updateTreeTitle(treeId: string, newTitle: string): Promise<void> {
  console.log("=== updateTreeTitle 执行 ===");
  console.log("treeId =", treeId);
  console.log("新名称 =", newTitle);

  const { error } = await supabase
    .from('trees')
    .update({ title: newTitle.trim() })
    .eq('id', treeId);

  if (error) {
    console.error("更新树名称失败", error);
    throw error;
  }

  console.log("✅ 认知树名称修改成功");
}

// ========== 认知树：初始化根节点 + 根节点笔记 ==========
//i：认知树id，根节点标签   o：新建根节点，对应的笔记
export async function initTreeRootNode(treeId: string, rootLabel: string = "根节点"): Promise<void> {
  console.log("=== initTreeRootNode 执行 ===");
  console.log("treeId =", treeId);

  const rootId = `node_${Date.now()}`;

  // 1. 保存根节点（使用 parentId 小驼峰）
  const { error: nodeError } = await supabase
    .from('tree_nodes')
    .insert([
      {
        id: rootId,
        tree_id: treeId,
        label: rootLabel,
        level: 0,
        order: 0,
        parentId: null, // 👈 小驼峰，完全匹配你的表结构
        branch: 'left',
        x: 0,
        y: 0,
      }
    ]);

  if (nodeError) {
    console.error("创建根节点失败", nodeError);
    throw nodeError;
  }
  console.log("✅ 根节点创建成功");

  // 2. 创建根节点笔记（无 tree_id 字段）
  const { error: noteError } = await supabase
    .from('notes')
    .insert([
      {
        node_id: rootId, // 👈 只通过 node_id 关联
        title: rootLabel,
        content: '',
      }
    ]);

  if (noteError) {
    console.error("创建根节点笔记失败", noteError);
    throw noteError;
  }
  console.log("✅ 根节点笔记创建成功");

  console.log("✅ 根节点 + 笔记初始化完成");
}