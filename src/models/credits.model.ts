// models/credits.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { ICredits } from '../interfaces/codeInterface.interface';

class Credits extends Model<ICredits> implements ICredits {
    public id!: string;
    public credit!: number;
    public price!: number;
    public title!: string;
    public description!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
}

Credits.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // Set default value to UUIDv4
        },
        credit: {
            type: DataTypes.NUMBER,
            allowNull: false,
        },
        price: {
            type: DataTypes.NUMBER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
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
        modelName: 'Credits',
    }
);

export default Credits;
