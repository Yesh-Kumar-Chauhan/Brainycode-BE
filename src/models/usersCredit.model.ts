// models/userCredits.model.ts
import { DataTypes, ForeignKey, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { IUsersCredit } from '../interfaces/codeInterface.interface';
import Users from './users.model';


class UsersCredits extends Model<IUsersCredit> implements IUsersCredit {
    public id!: string;
    public userId!: ForeignKey<Users['id']>;
    public credits!: number;
    public createdAt!: Date;
    public updatedAt!: Date;
}

UsersCredits.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // Set default value to UUIDv4
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        credits: {
            type: DataTypes.FLOAT,
            allowNull: false,
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
        modelName: 'UsersCredits',
    }
);

export default UsersCredits;
