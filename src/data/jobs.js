export const jobs = {
  knight: {
    label: '기사',
    core: '안정성, 체력, 방어',
    description: '전열에서 버티며 전투 흐름을 안정시키는 수호형 직업입니다.',
    recommendedElements: ['earth', 'metal'],
  },
  mage: {
    label: '마법사',
    core: '광역딜, 마나, 폭발력',
    description: '강력한 원소 마법으로 다수의 적을 제압하는 폭발형 직업입니다.',
    recommendedElements: ['fire', 'water'],
  },
  archer: {
    label: '궁수',
    core: '단일딜, 정확도, 치명타',
    description: '먼 거리에서 정확한 일격과 치명타로 적을 끊어내는 직업입니다.',
    recommendedElements: ['metal', 'fire'],
  },
  cleric: {
    label: '성직자',
    core: '회복, 버프, 축복',
    description: '회복과 축복으로 파티의 생존력을 끌어올리는 지원형 직업입니다.',
    recommendedElements: ['water', 'wood'],
  },
  spirit: {
    label: '정령사',
    core: '소환, 수집, 정령 계약',
    description: '정령과 계약해 성장시키고 전투를 확장하는 소환형 직업입니다.',
    recommendedElements: ['wood', 'water'],
  },
}

export const jobKeys = Object.keys(jobs)
