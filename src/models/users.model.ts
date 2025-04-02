// models/user.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { IUserAttributes } from '../interfaces/userInterface.interface';

class Users extends Model<IUserAttributes> implements IUserAttributes {
  
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public username!: string;
  public organisation!: string;
  public password!: string;
  public role!: string;
  public age!: number;
  public gender!: string;
  public technologies!: string;
  public otp!: number;
  public profileUrl!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Users.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // Set default value to UUIDv4
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    organisation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    technologies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    otp: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    profileUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Users',
  }
);

// Users.belongsTo(Prompts, { targetKey: 'userId' });
export default Users;
