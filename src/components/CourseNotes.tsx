import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CourseNotesProps {
  userId: string;
  courseId: string;
  moduleId: string;
}

export default function CourseNotes({ userId, courseId, moduleId }: CourseNotesProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [courseId, moduleId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_notes')
        .select('content')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('module_id', moduleId)
        .single();

      if (error) throw error;
      if (data) setNotes(data.content);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('course_notes')
        .upsert({
          user_id: userId,
          course_id: courseId,
          module_id: moduleId,
          content: notes,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Notes saved successfully');
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const clearNotes = async () => {
    if (!confirm('Are you sure you want to clear your notes?')) return;
    
    setNotes('');
    try {
      const { error } = await supabase
        .from('course_notes')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('module_id', moduleId);

      if (error) throw error;
      toast.success('Notes cleared');
    } catch (error) {
      toast.error('Failed to clear notes');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 size={24} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Module Notes</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={clearNotes}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear notes"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={saveNotes}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Notes
          </button>
        </div>
      </div>
      
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Take notes for this module..."
        className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}