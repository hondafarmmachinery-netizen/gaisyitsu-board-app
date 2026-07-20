export type Settings = {
  department: string;
  employeeName: string;
  intervalSeconds: number;
  lastAccidentDate: string;
  weatherSource: string;
  imagePath: string | null;
  updatedAt: string;
};

export type Member = {
  id: number;
  name: string;
};

export type State = {
  memberId: number;
  name: string;
  location: string;
  returnTime: string;
  updatedAt: string;
};
