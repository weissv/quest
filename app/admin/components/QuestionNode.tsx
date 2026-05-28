import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, Maximize2 } from 'lucide-react';

export default function QuestionNode({ data, isConnectable }: any) {
  const getBlockStyles = (block: string) => {
    switch (block) {
      case '0': return {
        bg: 'bg-teal/10',
        border: 'border-teal/30',
        text: 'text-teal',
        glow: 'hover:shadow-glow-teal border-t-teal',
        badge: 'bg-teal/20 border-teal/40 text-teal'
      };
      case 'A': return {
        bg: 'bg-success/10',
        border: 'border-success/30',
        text: 'text-success',
        glow: 'hover:shadow-glow-teal border-t-success', // Re-using glow-teal for success since they are similar
        badge: 'bg-success/20 border-success/40 text-success'
      };
      case 'B': return {
        bg: 'bg-warning/10',
        border: 'border-warning/30',
        text: 'text-warning',
        glow: 'hover:shadow-glow border-t-warning', // default glow is plum-ish but works well
        badge: 'bg-warning/20 border-warning/40 text-warning'
      };
      case 'C': return {
        bg: 'bg-violet/10',
        border: 'border-violet/30',
        text: 'text-violet',
        glow: 'hover:shadow-glow border-t-violet',
        badge: 'bg-violet/20 border-violet/40 text-violet'
      };
      default: return {
        bg: 'bg-foreground-tertiary/10',
        border: 'border-foreground-tertiary/30',
        text: 'text-foreground-tertiary',
        glow: 'hover:shadow-glow border-t-foreground-tertiary',
        badge: 'bg-foreground-tertiary/20 border-foreground-tertiary/40 text-foreground-tertiary'
      };
    }
  };

  const styles = getBlockStyles(data.block);
  
  const maxLength = 50;
  const truncatedText = data.text && data.text.length > maxLength 
    ? data.text.substring(0, maxLength) + '...' 
    : data.text;

  return (
    <div className={`group glass-card-elevated p-5 min-w-[300px] max-w-[340px] transition-all duration-300 hover:scale-[1.02] border-t-4 ${styles.glow} bg-surface/90 backdrop-blur-xl relative`}>
      <Handle 
        type="target" 
        position={Position.Top} 
        id="seq-target" 
        isConnectable={isConnectable} 
        className={`w-3 h-3 border-2 border-background-main ${styles.bg} ${styles.border}`} 
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="branch-target" 
        isConnectable={isConnectable} 
        className={`w-3 h-3 border-2 border-background-main ${styles.bg} ${styles.border}`} 
        style={{ top: '50%' }}
      />
      
      <div className="flex justify-between items-center mb-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest border uppercase ${styles.badge}`}>
          БЛОК {data.block}.{data.id.replace('q-', '')}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-foreground-tertiary font-mono uppercase tracking-widest">{data.type}</span>
          <Maximize2 className="w-3.5 h-3.5 text-foreground-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      <h4 className="font-medium text-sm mb-4 text-foreground leading-relaxed">
        {truncatedText}
      </h4>
      
      <div className="absolute top-full left-0 w-full mt-2 p-4 bg-surface-raised border border-foreground-tertiary/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        <p className="text-sm text-foreground-secondary leading-relaxed">{data.text}</p>
        
        {data.options && data.options.length > 0 && (
          <div className="mt-3 pt-3 border-t border-foreground-tertiary/10">
            <p className="text-[10px] uppercase tracking-wider text-foreground-tertiary mb-2 font-bold">Опции ({data.options.length})</p>
            <ul className="space-y-1.5">
              {data.options.map((opt: any, i: number) => (
                <li key={i} className="text-xs text-foreground flex justify-between gap-4">
                  <span className="truncate">{opt.label}</span>
                  <span className={`font-mono text-[10px] shrink-0 px-1.5 rounded ${styles.badge}`}>В:{opt.weight ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {data.options && data.options.length > 0 && (
          <div className="text-xs bg-surface-raised/50 p-2.5 rounded-lg border border-foreground-tertiary/10 flex items-center justify-between">
            <span className="text-foreground-secondary">{data.options.length} вариантов</span>
          </div>
        )}
        
        {data.dependsOn && (
           <div className={`mt-3 flex items-start gap-2 text-xs p-2.5 rounded-lg border ${styles.bg} ${styles.border} ${styles.text}`}>
             <GitBranch className="w-4 h-4 shrink-0 mt-0.5" />
             <div className="flex flex-col">
               <span className="font-bold">Ветвление</span>
               <span className="opacity-80 font-mono text-[10px] mt-0.5">{data.dependsOn.questionId}</span>
             </div>
           </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="seq-source" 
        isConnectable={isConnectable} 
        className={`w-3 h-3 border-2 border-background-main ${styles.bg} ${styles.border}`} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="branch-source" 
        isConnectable={isConnectable} 
        className={`w-3 h-3 border-2 border-background-main ${styles.bg} ${styles.border}`} 
        style={{ top: '50%' }}
      />
    </div>
  );
}
