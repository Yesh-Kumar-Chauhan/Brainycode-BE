// models/languages.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { ILanguages } from '../interfaces/codeInterface.interface';
import Prompts from './prompts.model';

class Languages extends Model<ILanguages> implements ILanguages {
    public id!: string;
    public language!: string;
    public framework!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
}

Languages.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // Set default value to UUIDv4
        },
        language: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        framework: {
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
        modelName: 'Languages',
    }
);

// LanguageFrameworks.belongsTo(Prompts, { targetKey: 'frameworkId' });
export default Languages;
