// models/prompts.ts
import { DataTypes, ForeignKey, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { EnumGenerateType, IPrompt } from '../interfaces/codeInterface.interface';
import Users from './users.model';
import LanguageFrameworks from './languages.model';
import PromptReviews from './promptsReviews.model';

class Prompts extends Model<IPrompt> implements IPrompt {
    public id!: string;
    public userId!:  ForeignKey<Users['id']>;;
    public prompt!: string;
    public finalPrompt!: string;
    public type!: EnumGenerateType;
    public languageId!: ForeignKey<LanguageFrameworks['id']>;
    public createdAt!: Date;
    public updatedAt!: Date;
}

Prompts.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // Set default value to UUIDv4
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            // references: {
            //     model: 'Users', // This is the name of the table
            //     key: 'id', // This is the primary key of the User table that userId references
            // },
        },
        prompt: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        finalPrompt: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        languageId : {
            type: DataTypes.UUID,
            allowNull: false,
            // references: {
            //     model: 'Frameworks', // This is the name of the table
            //     key: 'id', // This is the primary key of the Language table that languageId references
            // },
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
        modelName: 'Prompts',
    }
);


export default Prompts;
