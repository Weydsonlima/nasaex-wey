export interface Action {
  id: string;
  createdAt: Date;
  columnId: string | null;
  title: string;
  description: string | null;
  dueDate: Date | null;
  startDate: Date | null;
  createdBy: string;
  participants: {
    user: {
      id: string;
      name: string;
      image: string | null;
    };
  }[];
}
