import { supabase } from '../lib/supabase';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';//暂时没做登录逻辑，所以强行用这个id

const getCurrentUserId = async () => {
  return TEST_USER_ID; 
};
// ==============================================
// ✅ 正确的 TreeNode（没有 note_id！）
// ==============================================
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

// ======================
// 获取当前登录用户ID
// ======================
//const getCurrentUserId = async () => {
//  const { data } = await supabase.auth.getUser();
//  return data.user?.id;
//};

// ======================
// sidebar获取当前用户的所有认知树
// ======================
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

// ======================
// 树操作
// ======================
export const createTree = async (title: string) => {
  const treeId = `tree_${Date.now()}`;
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('trees')
    .insert({
      id: treeId,
      user_id: userId,
      title
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getOrCreateDefaultTree = async () => {
  const userId = await getCurrentUserId();

  const { data, error} = await supabase
    .from('trees')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .single();

    if(error) throw error;
  if (data) return data.id;
  return (await createTree('默认认知树')).id;
};

// ======================
// 节点操作（无 note_id）
// ======================
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
// 笔记操作（有 node_id ✅）
// ======================
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

export const deleteNoteByNodeId = async (nodeId: string) => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('node_id', nodeId);

  if (error) throw error;
};

// 根据 nodeId 获取笔记
export const getNoteByNodeId = async (nodeId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('node_id', nodeId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// 保存笔记（存在则更新，不存在则插入）
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