import { BlockType, BlockMeta } from '@/types';

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  '0': {
    id: '0',
    title: 'Идентификация',
    subtitle: 'Определение вашей реальной роли в семье',
    icon: '📥',
  },
  A: {
    id: 'A',
    title: 'Ситуационные сценарии',
    subtitle: 'Оценка реакций в стрессовых учебных ситуациях (SJT)',
    icon: '🎯',
  },
  B: {
    id: 'B',
    title: 'Глубинная верификация',
    subtitle: 'Открытые вопросы для уточнения позиции',
    icon: '🔍',
  },
  C: {
    id: 'C',
    title: 'Кросс-валидация',
    subtitle: 'Согласованность взглядов внутри семьи',
    icon: '🔁',
  },
  D: {
    id: 'D',
    title: 'Мотивационный фильтр',
    subtitle: 'Финальная проверка ценностей',
    icon: '🏁',
  },
};
