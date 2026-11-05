SELECT * FROM ticket_master

SELECT * FROM pmsticket_master

USE [ticket_system]
GO

EXEC sp_rename 'dbo.pmsticket_master.pmsticket_id', 'id_master', 'COLUMN';
GO


ALTER TABLE [dbo].[pmsticket_master]
ADD [pmsticket_id] [nvarchar](100) NULL;
GO


UPDATE [dbo].[pmsticket_master]
SET [pmsticket_id] = CAST([id_master] AS NVARCHAR(100));
GO