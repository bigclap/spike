export interface Resume {
  id: string;
  title: string;
  text: string;
}

export interface StoredResumes {
  [key: string]: {
    title: string;
    text: string;
  };
}

export interface VacancyData {
  score: number;
  status: 'analyzed' | 'applied' | 'error';
  timestamp: string;
}
