// models/credits.ts
import { DataTypes, ForeignKey, Model } from 'sequelize';
import { sequelize } from '../config/database';
import Users from './users.model';
import { IBillingAddress } from '../interfaces/subscriptions.interface';

class BillingAddress extends Model<IBillingAddress> implements IBillingAddress {
    public id!: string;
    public userId!: ForeignKey<Users['id']>
    public zipcode!: string;
    public state!: string;
    public address1!: string;
    public address2!: string;
    public city!: string;
    public shipTo!: string;
    public email!: string;
    public organisation!: string;
    public saveInfo!: boolean;
    public mobileNo!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
}

BillingAddress.init(
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
        zipcode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        state: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address1: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address2: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shipTo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        organisation: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mobileNo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        saveInfo: {
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
        modelName: 'BillingAddresses',
    }
);

export default BillingAddress;
