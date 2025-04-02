// models/credits.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { IBoardSpecifications } from '../interfaces/codeInterface.interface';

class BoardSpecifications extends Model<IBoardSpecifications> implements IBoardSpecifications {
    public id!: string;
    public model!: string;
    public processor!: string;
    public memory!: string;
    public storage!: string;
    public connectivity!: string;
    public ioports!: string;
    public dimensions!: string;
    public language!: string;
    public architecture!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
}

BoardSpecifications.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // Set default value to UUIDv4
        },
        model: DataTypes.STRING,
        processor: DataTypes.STRING,
        memory: DataTypes.STRING,
        storage: DataTypes.STRING,
        connectivity: DataTypes.STRING,
        ioports: DataTypes.STRING,
        dimensions: DataTypes.STRING,
        language: DataTypes.STRING,
        architecture: DataTypes.STRING,
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
        modelName: 'BoardSpecifications',
    }
);

export default BoardSpecifications;
